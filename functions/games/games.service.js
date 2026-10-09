const admin = require("firebase-admin");
const {FieldValue} = require("firebase-admin/firestore");
const {createTtlCache} = require("../shared/limits");

const MAX_GAME_LENGTH = 200;
// gRPC NOT_FOUND
const NOT_FOUND = 5;

class ValidationError extends Error {}

// Mismo id que usa el cliente (services/games/gameStats.js): el nombre del
// juego puede traer "/" (p. ej. "Fate/Grand Order"), que no es válido en un id
const gameStatsId = (game) => encodeURIComponent(game);

// Cada persona suma una sola búsqueda por juego por hora (auditoría B-25):
// repetir la búsqueda no infla la tendencia. En memoria de la instancia: con
// varias instancias puede contar alguna de más, nunca sin límite.
const recentSearches = createTtlCache({ttlMs: 60 * 60 * 1000, max: 20000});

// Suma una búsqueda al juego. Solo cuenta juegos que ya tienen publicaciones
// (su documento en game_stats lo crea el primer post): así nadie puede
// llenar la colección con nombres inventados.
const logGameSearch = async ({game} = {}, uid = null) => {
  if (typeof game !== "string" || !game.trim()) {
    throw new ValidationError("Juego requerido");
  }

  if (game.length > MAX_GAME_LENGTH) {
    throw new ValidationError("Nombre de juego demasiado largo");
  }

  const key = uid ? `${uid}|${game.trim().toLowerCase()}` : null;
  if (key && recentSearches.get(key)) {
    return {logged: false, repeated: true};
  }

  try {
    await admin.firestore()
        .collection("game_stats")
        .doc(gameStatsId(game))
        .update({
          searchCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
  } catch (error) {
    if (error.code === NOT_FOUND) {
      return {logged: false};
    }

    throw error;
  }

  if (key) recentSearches.set(key, true);
  return {logged: true};
};

module.exports = {
  logGameSearch,
  ValidationError,
};
