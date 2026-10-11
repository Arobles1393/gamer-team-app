const functions = require("firebase-functions");
const {getTwitchPresence, ValidationError} = require("./twitch.service");
const {describeError} = require("../shared/safeError");
const {perUserLimit} = require("../shared/callableLimits");

// Límite por usuario (auditoría M-09)
const limitTwitch = perUserLimit(20);

// Quién de una lista está en vivo en Twitch, en una sola llamada
exports.getTwitchPresence = functions.https.onCall(
    async (request) => {
      if (!request.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Debes iniciar sesión para consultar la presencia de Twitch",
        );
      }

      limitTwitch(request.auth.uid);

      try {
        return await getTwitchPresence(request.data);
      } catch (error) {
        console.error("❌ Error presencia Twitch:", describeError(error));

        if (error instanceof ValidationError) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              error.message,
          );
        }

        throw new functions.https.HttpsError(
            "internal",
            "Error obteniendo presencia de Twitch",
        );
      }
    },
);
