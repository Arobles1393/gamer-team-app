const crypto = require("crypto");
const axios = require("axios");
const admin = require("firebase-admin");
const {FieldValue, Timestamp} = require("firebase-admin/firestore");

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const CLAIMED_ID_REGEX =
  /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

const MAX_PARAMS = 20;
const MAX_VALUE_LENGTH = 1024;

// Una respuesta de Steam solo se acepta si es reciente
const MAX_RESPONSE_AGE_MS = 5 * 60 * 1000;

// El nonce se guarda más tiempo que la vida de la respuesta
const NONCE_TTL_MS = 60 * 60 * 1000;

// Campos que Steam debe haber firmado para que la respuesta valga
const REQUIRED_SIGNED_FIELDS = [
  "op_endpoint",
  "claimed_id",
  "identity",
  "return_to",
  "response_nonce",
  "assoc_handle",
];

const steamApi = axios.create({
  baseURL: "https://api.steampowered.com",
  timeout: 8000,
});

class ValidationError extends Error {}

// Orígenes de la app a los que Steam puede devolver al usuario. Sin esto,
// otro sitio podría reusar aquí una respuesta de Steam emitida para él.
const getAllowedOrigins = () => {
  const projectId = process.env.GCLOUD_PROJECT;

  const defaults = [
    // El servidor de desarrollo solo cuando corre en el emulador (auditoría B-24)
    process.env.FUNCTIONS_EMULATOR === "true" && "http://localhost:3000",
    projectId && `https://${projectId}.web.app`,
    projectId && `https://${projectId}.firebaseapp.com`,
  ];

  const extra = (process.env.STEAM_AUTH_ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

  return [...defaults, ...extra].filter(Boolean);
};

const validateParamsShape = (params) => {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    throw new ValidationError("Parámetros de Steam inválidos");
  }

  const entries = Object.entries(params);

  if (entries.length === 0 || entries.length > MAX_PARAMS) {
    throw new ValidationError("Parámetros de Steam inválidos");
  }

  for (const [key, value] of entries) {
    if (
      !key.startsWith("openid.") ||
      typeof value !== "string" ||
      value.length > MAX_VALUE_LENGTH
    ) {
      throw new ValidationError("Parámetros de Steam inválidos");
    }
  }
};

const validateAssertion = (params) => {
  if (
    params["openid.ns"] !== "http://specs.openid.net/auth/2.0" ||
    params["openid.mode"] !== "id_res" ||
    params["openid.op_endpoint"] !== STEAM_OPENID_URL ||
    params["openid.claimed_id"] !== params["openid.identity"]
  ) {
    throw new ValidationError("Respuesta de Steam inválida");
  }

  const signed = (params["openid.signed"] || "").split(",");

  if (!REQUIRED_SIGNED_FIELDS.every((field) => signed.includes(field))) {
    throw new ValidationError("Respuesta de Steam sin firmar");
  }

  let returnTo;

  try {
    returnTo = new URL(params["openid.return_to"]);
  } catch (error) {
    throw new ValidationError("Respuesta de Steam inválida");
  }

  if (
    !getAllowedOrigins().includes(returnTo.origin) ||
    returnTo.pathname !== "/auth/steam/return"
  ) {
    throw new ValidationError("Origen de Steam no permitido");
  }

  // response_nonce empieza con la fecha de emisión: 2026-09-30T12:00:00Z...
  const issuedAt = Date.parse(
      (params["openid.response_nonce"] || "").slice(0, 20),
  );

  if (
    Number.isNaN(issuedAt) ||
    Date.now() - issuedAt > MAX_RESPONSE_AGE_MS
  ) {
    throw new ValidationError("La respuesta de Steam expiró");
  }
};

// Reenvía la respuesta a Steam para que confirme la firma
const verifyOpenIdResponse = async (params) => {
  validateParamsShape(params);
  validateAssertion(params);

  const body = new URLSearchParams({
    ...params,
    "openid.mode": "check_authentication",
  });

  const {data} = await axios.post(STEAM_OPENID_URL, body.toString(), {
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    timeout: 8000,
  });

  if (!/^is_valid\s*:\s*true$/m.test(data)) {
    throw new ValidationError("Steam no validó la respuesta");
  }

  const match = params["openid.claimed_id"].match(CLAIMED_ID_REGEX);

  if (!match) {
    throw new ValidationError("SteamID inválido");
  }

  return match[1];
};

// create() falla si el documento ya existe: cada respuesta sirve una vez
const consumeNonce = async (params) => {
  const canonical = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

  const hash = crypto
      .createHash("sha256")
      .update(canonical)
      .digest("hex");

  try {
    await admin.firestore()
        .collection("steamNonces")
        .doc(hash)
        .create({
          createdAt: FieldValue.serverTimestamp(),
          expiresAt: Timestamp.fromMillis(
              Date.now() + NONCE_TTL_MS,
          ),
        });
  } catch (error) {
    // 6 = ALREADY_EXISTS
    if (error.code === 6) {
      throw new ValidationError("Esta respuesta de Steam ya fue usada");
    }

    throw error;
  }
};

const getPublicProfile = async (steamId64) => {
  const key = process.env.STEAM_API_KEY;

  if (!key) {
    throw new Error("API Key no configurada");
  }

  const res = await steamApi.get(
      "/ISteamUser/GetPlayerSummaries/v0002/",
      {
        params: {
          key,
          steamids: steamId64,
        },
      },
  );

  const player = res.data.response?.players?.[0];

  return {
    username: player?.personaname || null,
    avatar: player?.avatarfull || null,
  };
};

// ---------- uid de las cuentas de Steam ----------
// Seudónimo (verificación legal, punto 6): el uid aparece en datos públicos
// (id del perfil, autor de partidas y comentarios), así que no puede llevar
// el SteamID. Se deriva con HMAC-SHA256 y una clave que solo tiene el
// servidor (STEAM_UID_SECRET): la misma cuenta de Steam siempre da el mismo
// uid, y sin la clave no se puede volver al SteamID. 28 caracteres
// base64url, como los uid de Firebase.
// Las cuentas creadas antes usan "steam:<SteamID64>" y lo conservan.
const MIN_SECRET_LENGTH = 32;
const legacySteamUid = (steamId64) => `steam:${steamId64}`;

const steamUid = (steamId64, secret) => {
  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`STEAM_UID_SECRET no configurada (mínimo ${MIN_SECRET_LENGTH} caracteres)`);
  }
  return crypto.createHmac("sha256", secret)
      .update(`steam-uid:${steamId64}`)
      .digest("base64url")
      .slice(0, 28);
};

// uid con el que entra esta cuenta de Steam: el anterior si ya existe esa
// cuenta; si no, el seudónimo. getUser se puede reemplazar en pruebas
const resolveSteamUid = async (steamId64, {
  secret = process.env.STEAM_UID_SECRET,
  getUser = (uid) => admin.auth().getUser(uid),
} = {}) => {
  const legacy = legacySteamUid(steamId64);
  const existing = await getUser(legacy).catch((error) => {
    if (error.code === "auth/user-not-found") return null;
    throw error;
  });
  return existing ? legacy : steamUid(steamId64, secret);
};

const loginWithSteam = async (params) => {
  const steamId64 = await verifyOpenIdResponse(params);

  await consumeNonce(params);

  const uid = await resolveSteamUid(steamId64);
  const [customToken, profile] = await Promise.all([
    admin.auth().createCustomToken(uid),
    getPublicProfile(steamId64).catch((error) => {
      // Sin perfil público igual se puede iniciar sesión
      console.error(
          "⚠️ No se pudo obtener el perfil de Steam:",
          error.message,
      );
      return {username: null, avatar: null};
    }),
  ]);

  return {
    customToken,
    steamId64,
    ...profile,
  };
};

module.exports = {
  loginWithSteam,
  steamUid,
  resolveSteamUid,
  verifyOpenIdResponse,
  getPublicProfile,
  getAllowedOrigins,
  ValidationError,
};
