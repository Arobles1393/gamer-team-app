const functions = require("firebase-functions");
const {getJoinInfo, ValidationError, RateLimitError} = require("./steamJoin.service");

// Misma condición que canWriteSocial en firestore.rules: correo verificado
// o cuenta de Steam (custom token, sin correo)
const canUseSocial = (token) =>
  token?.email_verified === true || token?.firebase?.sign_in_provider === "custom";

const parseRequest = (data) => {
  const {targetUid, postId} = data || {};
  if (typeof targetUid !== "string" || !targetUid.trim()) {
    throw new ValidationError("targetUid requerido");
  }
  if (postId !== undefined && postId !== null && typeof postId !== "string") {
    throw new ValidationError("postId inválido");
  }
  return {targetUid, postId: postId || null};
};

// "Unirme en Steam" (ver steamJoin.service.js). Los logs llevan solo
// códigos de error: nunca uids, SteamIDs, enlaces ni respuestas de Steam.
exports.getJoinInfo = functions.https.onCall(
    async (request) => {
      if (!request.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Debes iniciar sesión",
        );
      }

      if (!canUseSocial(request.auth.token)) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "Verifica tu correo para continuar",
        );
      }

      try {
        const {targetUid, postId} = parseRequest(request.data);
        return await getJoinInfo({callerUid: request.auth.uid, targetUid, postId});
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new functions.https.HttpsError("invalid-argument", "Datos inválidos");
        }
        if (error instanceof RateLimitError) {
          throw new functions.https.HttpsError("resource-exhausted", "Demasiadas consultas, intenta en un momento");
        }

        console.error("❌ getJoinInfo:", error.code || error.name || "error");

        throw new functions.https.HttpsError(
            "internal",
            "No se pudo consultar la partida",
        );
      }
    },
);
