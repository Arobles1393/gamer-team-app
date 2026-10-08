const functions = require("firebase-functions");
const { getSteamStats, getSteamPresence, ValidationError  } = require("./steam.service");
const {describeError} = require("../shared/safeError");

exports.getSteamStats = functions.https.onCall(
  async (request) => {

    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes iniciar sesión para consultar estadísticas de Steam"
      );
    }

    try {
      return await getSteamStats(request.data);
    } catch (error) {
      console.error("❌ Error Steam:", describeError(error));

      if (error instanceof ValidationError) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          error.message
        );
      }

      // El detalle queda en los logs; al cliente no se le exponen errores internos
      throw new functions.https.HttpsError(
        "internal",
        "Error obteniendo datos de Steam"
      );
    }
  }
);

// Presencia de Steam de una lista de jugadores en una sola llamada
exports.getSteamPresence = functions.https.onCall(
  async (request) => {

    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes iniciar sesión para consultar la presencia de Steam"
      );
    }

    try {
      return await getSteamPresence(request.data);
    } catch (error) {
      console.error("❌ Error presencia Steam:", describeError(error));

      if (error instanceof ValidationError) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          error.message
        );
      }

      throw new functions.https.HttpsError(
        "internal",
        "Error obteniendo presencia de Steam"
      );
    }
  }
);