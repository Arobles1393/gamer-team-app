const functions = require("firebase-functions");
const { getCommunityStats, ValidationError } = require("./community.service");
const {describeError} = require("../shared/safeError");
const {perUserLimit} = require("../shared/callableLimits");

// Límite por usuario (auditoría M-09)
const limitCommunity = perUserLimit(20);

// Mapa de la comunidad: jugadores activos por país (solo conteos
// agregados, nunca usuarios). Ver community.service.js.
exports.getCommunityStats = functions.https.onCall(
  async (request) => {

    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes iniciar sesión para ver la comunidad"
      );
    }

    limitCommunity(request.auth.uid);

    try {
      return await getCommunityStats(request.data);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          error.message
        );
      }

      console.error("❌ Error estadísticas de la comunidad:", describeError(error));

      throw new functions.https.HttpsError(
        "internal",
        "Error obteniendo la actividad de la comunidad"
      );
    }
  }
);
