const functions = require("firebase-functions");
const {createRateLimiter, RateLimitError} = require("./limits");

// Límite por usuario para una callable: al pasarse responde
// resource-exhausted (el cliente lo trata como cualquier error de red).
// Se llama antes del try de la función, para que no se convierta en "internal".
const perUserLimit = (limit, windowMs = 60 * 1000) => {
  const limiter = createRateLimiter(limit, windowMs);

  return (uid) => {
    try {
      limiter(uid);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new functions.https.HttpsError(
            "resource-exhausted",
            "Demasiadas solicitudes, intenta en un momento",
        );
      }
      throw error;
    }
  };
};

module.exports = {perUserLimit};
