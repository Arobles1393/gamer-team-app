const functions = require("firebase-functions");
const {searchGames, getGameDetail, ValidationError} = require("./rawg.service");
const {describeError} = require("../shared/safeError");
const {perUserLimit} = require("../shared/callableLimits");

// Búsqueda y detalle comparten el límite: el buscador consulta al escribir
// (con espera entre teclas), así que 40 por minuto sobra para una persona
const limitRawg = perUserLimit(40);

const requireAuth = (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Debes iniciar sesión para buscar juegos");
  }
  limitRawg(request.auth.uid);
};

const mapRawgError = (error, fallbackMessage) => {
  if (error instanceof ValidationError) {
    return new functions.https.HttpsError("invalid-argument", error.message);
  }
  console.error("❌ RAWG Error:", describeError(error));
  return new functions.https.HttpsError("internal", fallbackMessage);
};

// {query} -> {results: [{id, label, value, image, platforms}]}
exports.searchRawgGames = functions.https.onCall(async (request) => {
  requireAuth(request);
  try {
    return {results: await searchGames(request.data?.query)};
  } catch (error) {
    throw mapRawgError(error, "Error buscando juegos");
  }
});

// {gameId} -> {steamAppId, clip}
exports.getRawgGameDetail = functions.https.onCall(async (request) => {
  requireAuth(request);
  try {
    return await getGameDetail(request.data?.gameId);
  } catch (error) {
    throw mapRawgError(error, "Error obteniendo el juego");
  }
});
