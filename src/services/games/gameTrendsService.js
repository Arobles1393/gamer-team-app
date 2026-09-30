import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where
} from "firebase/firestore";
import { db } from "../../firebase/config";

// Límite del operador "in" de Firestore
const MAX_IN_VALUES = 30;

const subscribeToTrending = (field, limitGames, onSuccess, onError) => {
  const q = query(
    collection(db, "game_stats"),
    orderBy(field, "desc"),
    limit(limitGames)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onSuccess(
        snapshot.docs
          .map((doc) => doc.data())
          // Un juego sin publicaciones o sin búsquedas no es tendencia
          .filter((stats) => stats[field] > 0)
          .map((stats) => stats.game)
      );
    },
    onError
  );
};

// Juegos con más publicaciones
const subscribeToTrendingByVolume = (limitGames, onSuccess, onError) =>
  subscribeToTrending("postCount", limitGames, onSuccess, onError);

// Juegos más buscados en el feed
const subscribeToTrendingBySearch = (limitGames, onSuccess, onError) =>
  subscribeToTrending("searchCount", limitGames, onSuccess, onError);

// Todos los juegos con al menos una publicación (opciones del filtro por juego)
const subscribeToGames = (onSuccess, onError) => {
  const q = query(
    collection(db, "game_stats"),
    where("postCount", ">", 0)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onSuccess(
        snapshot.docs
          .map((doc) => doc.data().game)
          .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
      );
    },
    onError
  );
};

// Posts más recientes de varios juegos combinados (fila de una tendencia)
const getPostsForGames = async (gameNames, limitPosts) => {
  if (!gameNames.length) {
    return [];
  }

  const q = query(
    collection(db, "posts"),
    where("game", "in", gameNames.slice(0, MAX_IN_VALUES)),
    orderBy("createdAt", "desc"),
    limit(limitPosts)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const gameTrendsService = {
  subscribeToTrendingByVolume,
  subscribeToTrendingBySearch,
  subscribeToGames,
  getPostsForGames
};
