const functions = require("firebase-functions");
const {logGameSearch, ValidationError} = require("./games.service");
const {describeError} = require("../shared/safeError");
const {perUserLimit} = require("../shared/callableLimits");

// Límite por usuario: sin él se podían inflar las tendencias (auditoría M-09)
const limitSearchLog = perUserLimit(30);

// Tendencia por búsquedas del feed. onCall normal (no trigger): funciona en Spark
exports.logGameSearch = functions.https.onCall(
    async (request) => {
      if (!request.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Debes iniciar sesión para registrar búsquedas",
        );
      }

      limitSearchLog(request.auth.uid);

      try {
        return await logGameSearch(request.data, request.auth.uid);
      } catch (error) {
        console.error("❌ Error registrando búsqueda:", describeError(error));

        if (error instanceof ValidationError) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              error.message,
          );
        }

        throw new functions.https.HttpsError(
            "internal",
            "Error registrando la búsqueda",
        );
      }
    },
);
