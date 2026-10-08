const {RateLimitError, createRateLimiter: createSharedRateLimiter} = require("../shared/limits");
const admin = require("firebase-admin");
const {steamApi, resolveVanity, STEAM_ID64_REGEX, VANITY_REGEX} = require("../steam/steam.service");

// "Unirme en Steam": devuelve el enlace steam://joinlobby a la sala de Steam
// de otra persona, SOLO si ella lo permitió (privacy.allowSteamJoin), no hay
// bloqueo entre las dos y quien pide es su amigo o marcó "Quiero jugar" en
// una partida suya.
//
// Privacidad (no negociable):
// - Nunca se lee ni se devuelve la IP de un servidor (gameserverip) ni se
//   usa steam://connect: solo steam://joinlobby.
// - Ninguna otra función devuelve lobbysteamid (ver steam/steam.service.js).
// - Todo resultado negativo es idéntico: { available: false }. No dice qué
//   falló (amistad, interés, permiso, bloqueo, Steam o sala).
// - No se guarda nada de las salas (ni en Firestore ni en logs). Solo hay
//   una caché en memoria de la respuesta de Steam, de 20 s.

class ValidationError extends Error {}

const NOT_AVAILABLE = Object.freeze({available: false});
const notAvailable = () => ({...NOT_AVAILABLE});

// ---------- Funciones puras ----------

const isEligible = ({isFriend, hasInterest, isBlocked, consent}) =>
  consent === true && !isBlocked && (isFriend === true || hasInterest === true);

const DIGITS = /^\d+$/;

// Solo números validados: nunca se interpola texto sin validar
const buildJoinUrl = ({appId, lobbyId, hostSteamId}) => {
  const app = typeof appId === "number" ? String(appId) : appId;
  if (typeof app !== "string" || !DIGITS.test(app)) return null;
  if (typeof lobbyId !== "string" || !DIGITS.test(lobbyId) || /^0+$/.test(lobbyId)) return null;
  if (typeof hostSteamId !== "string" || !STEAM_ID64_REGEX.test(hostSteamId)) return null;
  return `steam://joinlobby/${app}/${lobbyId}/${hostSteamId}`;
};

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;

const sanitizeGameName = (name) => {
  if (typeof name !== "string") return null;
  const clean = name.replace(CONTROL_CHARS, "").trim().slice(0, 80).trim();
  return clean || null;
};

// SteamID64 o vanity del enlace de Steam del perfil (misma lógica que el
// cliente: último tramo de .../profiles/<id> o .../id/<vanity>)
const steamIdentifierFromLinks = (links) => {
  const link = (Array.isArray(links) ? links : []).find(
      (item) => typeof item === "string" && item.includes("steamcommunity.com"),
  );
  if (!link) return null;
  const last = link.replace(/\/+$/, "").split("/").pop();
  return STEAM_ID64_REGEX.test(last) || VANITY_REGEX.test(last) ? last : null;
};

// ---------- Límite de uso (en memoria, por instancia: aproximado) ----------

// El limitador es el compartido (functions/shared/limits.js), con los
// valores por defecto de esta función
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;
const createRateLimiter = (limit = RATE_LIMIT, windowMs = RATE_WINDOW_MS, now = () => Date.now()) =>
  createSharedRateLimiter(limit, windowMs, now);

// ---------- Steam (caché de 20 s por steamId, solo de la respuesta) ----------

const SUMMARY_TTL_MS = 20 * 1000;
const summaryCache = new Map();

// Solo gameid, gameextrainfo y lobbysteamid (nada de gameserverip)
const fetchPlayerSummary = async (steamId) => {
  const cached = summaryCache.get(steamId);
  if (cached && Date.now() - cached.at < SUMMARY_TTL_MS) return cached.value;

  const key = process.env.STEAM_API_KEY;
  if (!key) throw new Error("API Key no configurada");

  const res = await steamApi.get("/ISteamUser/GetPlayerSummaries/v0002/", {
    params: {key, steamids: steamId},
  });
  const player = res.data?.response?.players?.[0];
  const value = player ?
    {
      gameid: player.gameid ?? null,
      gameextrainfo: player.gameextrainfo ?? null,
      lobbysteamid: player.lobbysteamid ?? null,
    } :
    null;
  summaryCache.set(steamId, {at: Date.now(), value});
  return value;
};

const resolveSteamId64 = async (identifier) => {
  if (!identifier) return null;
  if (STEAM_ID64_REGEX.test(identifier)) return identifier;
  const key = process.env.STEAM_API_KEY;
  if (!key) throw new Error("API Key no configurada");
  return resolveVanity(identifier, key);
};

// ---------- Con Firestore ----------

// deps se pueden reemplazar en pruebas (Firestore del emulador, Steam falso)
const createGetJoinInfo = ({
  db = () => admin.firestore(),
  getSummary = fetchPlayerSummary,
  resolveSteam = resolveSteamId64,
  rateLimit = createRateLimiter(),
} = {}) => async ({callerUid, targetUid, postId}) => {
  rateLimit(callerUid);
  if (callerUid === targetUid) return notAvailable();
  const firestore = db();

  // 2. Permiso de quien juega (lo más barato primero)
  const prefs = await firestore.doc(`users/${targetUid}/private/preferences`).get();
  const consent = prefs.data()?.privacy?.allowSteamJoin === true;
  if (!consent) return notAvailable();

  // 3. Bloqueos en cualquier dirección
  const blocks = await firestore.collection("blocks")
      .where("participants", "array-contains", callerUid)
      .select("participants")
      .get();
  const isBlocked = blocks.docs.some((d) => (d.get("participants") || []).includes(targetUid));

  // 4. Amistad. Límite de 1000 amistades por consulta: suficiente para esta
  //    escala; si alguien tuviera más, la comprobación por interés sigue
  //    funcionando y, en el peor caso, el botón no aparece (falla cerrado)
  const friends = await firestore.collection("friends")
      .where("users", "array-contains", callerUid)
      .select("users")
      .limit(1000)
      .get();
  const isFriend = friends.docs.some((d) => (d.get("users") || []).includes(targetUid));

  // 5. Interés: solo si no es amigo y viene la partida
  let hasInterest = false;
  if (!isFriend && typeof postId === "string" && postId) {
    const post = await firestore.doc(`posts/${postId}`).get();
    if (post.exists && post.get("userId") === targetUid) {
      const interest = await firestore.collection("post_interested")
          .where("postId", "==", postId)
          .where("userId", "==", callerUid)
          .limit(1)
          .get();
      hasInterest = !interest.empty;
    }
  }

  // 6.
  if (!isEligible({isFriend, hasInterest, isBlocked, consent})) return notAvailable();

  // 7. SteamID del enlace del perfil. Limitación conocida: es un enlace que
  //    pegó el propio usuario; no está verificado que la cuenta sea suya
  const target = await firestore.doc(`users/${targetUid}`).get();
  const hostSteamId = await resolveSteam(steamIdentifierFromLinks(target.get("links")));
  if (typeof hostSteamId !== "string" || !STEAM_ID64_REGEX.test(hostSteamId)) return notAvailable();

  // 8.-9. Sala en este momento (si el perfil y el juego la exponen)
  const summary = await getSummary(hostSteamId);
  if (!summary) return notAvailable();
  const joinUrl = buildJoinUrl({appId: summary.gameid, lobbyId: summary.lobbysteamid, hostSteamId});
  if (!joinUrl) return notAvailable();

  // 10. Solo esto: nada de lobbysteamid suelto, steamid ni gameserverip
  return {available: true, gameName: sanitizeGameName(summary.gameextrainfo), joinUrl};
};

const getJoinInfo = createGetJoinInfo();

module.exports = {
  getJoinInfo,
  createGetJoinInfo,
  createRateLimiter,
  isEligible,
  buildJoinUrl,
  sanitizeGameName,
  steamIdentifierFromLinks,
  ValidationError,
  RateLimitError,
  NOT_AVAILABLE,
};
