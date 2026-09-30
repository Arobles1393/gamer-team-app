const functions = require("firebase-functions");
const { loginWithSteam, ValidationError } = require("./steamAuth.service");

// Sin check de request.auth: esta función es la que autentica al usuario
exports.loginWithSteam = functions.https.onCall(
  async (request) => {
    try {
      return await loginWithSteam(request.data?.params);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          error.message
        );
      }

      console.error("❌ Error Steam Auth:", error);

      throw new functions.https.HttpsError(
        "internal",
        "Error iniciando sesión con Steam"
      );
    }
  }
);
