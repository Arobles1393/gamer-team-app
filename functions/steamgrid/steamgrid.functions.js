const functions = require("firebase-functions");
const { getGameLogo, getGamePortada, ValidationError } = require("./steamgrid.service");

const mapSteamGridError = (error, fallbackMessage) => {
  if (error instanceof ValidationError) {
    return new functions.https.HttpsError("invalid-argument", error.message);
  }

  console.error("❌ SteamGrid Error:", error);

  return new functions.https.HttpsError("internal", fallbackMessage);
};

exports.getGameLogo = functions.https.onCall(async (request) => {

  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Debes iniciar sesión para consultar el logo del juego"
    );
  }

  try {
    return await getGameLogo(request.data);
  } catch (error) {
    throw mapSteamGridError(error, "Error obteniendo logo");
  }
});

exports.getGamePortada = functions.https.onCall(async (request) => {

  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Debes iniciar sesión para consultar la portada del juego"
    );
  }

  try {
    return await getGamePortada(request.data);
  } catch (error) {
    throw mapSteamGridError(error, "Error obteniendo portada");
  }
});