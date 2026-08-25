const functions = require("firebase-functions");
const { getSteamStats, ValidationError  } = require("./steam.service");

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
      console.error("❌ Error Steam:", error);

      if (error instanceof ValidationError) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          error.message
        );
      }

      throw new functions.https.HttpsError(
        "internal",
        error.message || "Error obteniendo datos de Steam"
      );
    }
  }
);