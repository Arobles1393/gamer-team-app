const functions = require("firebase-functions");
const {moderate, ValidationError, ForbiddenTargetError} = require("./moderation.service");
const {perUserLimit} = require("../shared/callableLimits");

const limit = perUserLimit(30);

// Acciones de moderación del panel de reportes (ver moderation.service.js).
// Solo cuentas con el claim admin (functions/scripts/setAdmin.js).
exports.moderate = functions.https.onCall(
    {timeoutSeconds: 300, memory: "512MiB"},
    async (request) => {
      if (request.auth?.token?.admin !== true) {
        throw new functions.https.HttpsError("permission-denied", "Solo para admin");
      }
      limit(request.auth.uid);

      try {
        return await moderate(request.auth.uid, request.data);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new functions.https.HttpsError("invalid-argument", error.message);
        }
        if (error instanceof ForbiddenTargetError) {
          throw new functions.https.HttpsError("failed-precondition", error.message);
        }
        console.error("❌ Error de moderación:", error.code || error.message);
        throw new functions.https.HttpsError("internal", "No se pudo completar la acción");
      }
    },
);
