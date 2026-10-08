const axios = require("axios");

// Límite real de /helix/streams por llamada
const MAX_PRESENCE_USERS = 100;
const TWITCH_USERNAME_REGEX = /^[a-z0-9_]{4,25}$/;
// Se renueva un poco antes de que venza
const TOKEN_MARGIN_MS = 5 * 60 * 1000;

class ValidationError extends Error {}

// App Access Token (Client Credentials). Dura ~60 días: se guarda mientras
// viva la instancia para no pedir uno nuevo en cada llamada.
let tokenCache = {token: null, expiresAt: 0};

const getCredentials = () => {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  return clientId && clientSecret ? {clientId, clientSecret} : null;
};

const getAppAccessToken = async ({clientId, clientSecret}) => {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - TOKEN_MARGIN_MS) {
    return tokenCache.token;
  }

  const {data} = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }).toString(),
      {
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        timeout: 8000,
      },
  );

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.token;
};

const fetchStreams = (usernames, credentials, token) => {
  const params = new URLSearchParams();
  usernames.forEach((username) => params.append("user_login", username));
  params.append("first", String(MAX_PRESENCE_USERS));

  return axios.get(`https://api.twitch.tv/helix/streams?${params}`, {
    headers: {
      "Client-Id": credentials.clientId,
      "Authorization": `Bearer ${token}`,
    },
    timeout: 8000,
  });
};

// Recibe usuarios de Twitch y devuelve { [usuario]: { isLive, gameName, title } }
// en una sola llamada. Twitch solo devuelve los streams activos: quien no
// aparece no está en vivo. Sin credenciales configuradas responde vacío
// (configured: false) en vez de fallar.
const getTwitchPresence = async ({usernames} = {}) => {
  if (!Array.isArray(usernames) || usernames.length === 0) {
    throw new ValidationError("usernames requerido");
  }

  if (usernames.length > MAX_PRESENCE_USERS) {
    throw new ValidationError(
        `Máximo ${MAX_PRESENCE_USERS} usuarios por consulta`,
    );
  }

  const logins = [...new Set(usernames.map((u) => String(u).toLowerCase()))];

  if (!logins.every((login) => TWITCH_USERNAME_REGEX.test(login))) {
    throw new ValidationError("usernames inválidos");
  }

  const credentials = getCredentials();

  if (!credentials) {
    console.warn("⚠️ TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET no configurados");
    return {presence: {}, configured: false};
  }

  let token = await getAppAccessToken(credentials);
  let response;

  try {
    response = await fetchStreams(logins, credentials, token);
  } catch (error) {
    // Token revocado o vencido antes de tiempo: uno nuevo y se reintenta
    if (error.response?.status !== 401) throw error;

    tokenCache = {token: null, expiresAt: 0};
    token = await getAppAccessToken(credentials);
    response = await fetchStreams(logins, credentials, token);
  }

  const presence = Object.fromEntries(
      logins.map((login) => [login, {isLive: false, gameName: null, title: null}]),
  );

  for (const stream of response.data.data || []) {
    presence[stream.user_login.toLowerCase()] = {
      isLive: stream.type === "live",
      gameName: stream.game_name || null,
      title: stream.title || null,
    };
  }

  return {presence, configured: true};
};

module.exports = {
  getTwitchPresence,
  ValidationError,
};
