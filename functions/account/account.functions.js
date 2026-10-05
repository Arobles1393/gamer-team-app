const functions = require("firebase-functions");
const { deleteAccount, assertRecentLogin, RecentLoginError } = require("./account.service");

// Elimina la cuenta de quien llama y todo lo ligado a ella (ver
// account.service.js). El uid sale SIEMPRE de request.auth: cualquier uid
// en request.data se ignora. Pide haber iniciado sesión hace menos de 5 min.
exports.deleteAccount = functions.https.onCall(
  { timeoutSeconds: 300, memory: "512MiB" },
  async (request) => {

    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes iniciar sesión para eliminar tu cuenta"
      );
    }

    try {
      assertRecentLogin(request.auth.token);
      return await deleteAccount(request.auth.uid);
    } catch (error) {
      if (error instanceof RecentLoginError) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "requires-recent-login",
          { reason: "requires-recent-login" }
        );
      }

      console.error("❌ Error eliminando la cuenta:", error.code || error.message);

      throw new functions.https.HttpsError(
        "internal",
        "No se pudo eliminar la cuenta"
      );
    }
  }
);
