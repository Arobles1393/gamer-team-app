const functions = require("firebase-functions");
const { fetchLinkPreview, ValidationError } = require("./guides.service");
const {describeError} = require("../shared/safeError");
const {perUserLimit} = require("../shared/callableLimits");

// Límite por usuario: cada llamada pide una página externa (auditoría M-09)
const limitLinkPreview = perUserLimit(10);

// Vista previa (título, descripción, imagen) de una guía externa. Nunca
// pide direcciones internas (ver guides.service.js) y, si no se puede
// generar, responde la vista previa vacía en vez de fallar.
exports.fetchLinkPreview = functions.https.onCall(
  async (request) => {

    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes iniciar sesión para generar la vista previa"
      );
    }

    limitLinkPreview(request.auth.uid);

    try {
      return await fetchLinkPreview(request.data);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          error.message
        );
      }

      console.error("❌ Error vista previa de link:", describeError(error));

      throw new functions.https.HttpsError(
        "internal",
        "Error generando la vista previa"
      );
    }
  }
);
