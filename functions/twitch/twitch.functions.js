const functions = require("firebase-functions");
const { getTwitchPresence, ValidationError } = require("./twitch.service");

// Quién de una lista está en vivo en Twitch, en una sola llamada
exports.getTwitchPresence = functions.https.onCall(
  async (request) => {

    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes iniciar sesión para consultar la presencia de Twitch"
      );
    }

    try {
      return await getTwitchPresence(request.data);
    } catch (error) {
      console.error("❌ Error presencia Twitch:", error);

      if (error instanceof ValidationError) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          error.message
        );
      }

      throw new functions.https.HttpsError(
        "internal",
        "Error obteniendo presencia de Twitch"
      );
    }
  }
);
