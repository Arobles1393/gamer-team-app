const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

const MAX_GAME_LENGTH = 200;
// gRPC NOT_FOUND
const NOT_FOUND = 5;

class ValidationError extends Error {}

// Mismo id que usa el cliente (services/games/gameStats.js): el nombre del
// juego puede traer "/" (p. ej. "Fate/Grand Order"), que no es válido en un id
const gameStatsId = (game) => encodeURIComponent(game);

// Suma una búsqueda al juego. Solo cuenta juegos que ya tienen publicaciones
// (su documento en game_stats lo crea el primer post): así nadie puede
// llenar la colección con nombres inventados.
const logGameSearch = async ({ game } = {}) => {
  if (typeof game !== "string" || !game.trim()) {
    throw new ValidationError("Juego requerido");
  }

  if (game.length > MAX_GAME_LENGTH) {
    throw new ValidationError("Nombre de juego demasiado largo");
  }

  try {
    await admin.firestore()
      .collection("game_stats")
      .doc(gameStatsId(game))
      .update({
        searchCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
      });
  } catch (error) {
    if (error.code === NOT_FOUND) {
      return { logged: false };
    }

    throw error;
  }

  return { logged: true };
};

module.exports = {
  logGameSearch,
  ValidationError
};
