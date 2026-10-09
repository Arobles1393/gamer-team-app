import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { getIntlLocale } from "../../i18n";

// Solo cuentan los documentos con el id que les corresponde (el nombre del
// juego codificado, como gameStats.js): uno creado con otro id para el mismo
// juego no duplica ni infla la tendencia (auditoría B-25)
const statsOf = (snapshot) =>
  snapshot.docs
    .filter((doc) => typeof doc.data().game === "string" && doc.id === encodeURIComponent(doc.data().game))
    .map((doc) => doc.data());

// Límite del operador "in" de Firestore
const MAX_IN_VALUES = 30;
// Juegos que forman una tendencia en /explorar (volumen y búsquedas)
const EXPLORE_TRENDING_GAMES = 20;

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
        statsOf(snapshot)
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

// Juegos con publicaciones para el filtro por juego: los que más tienen,
// con un tope para que la lista no crezca sin límite con el catálogo
const MAX_FILTER_GAMES = 100;

const subscribeToGames = (onSuccess, onError) => {
  const q = query(
    collection(db, "game_stats"),
    where("postCount", ">", 0),
    orderBy("postCount", "desc"),
    limit(MAX_FILTER_GAMES)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onSuccess(
        statsOf(snapshot)
          .map((stats) => stats.game)
          .sort((a, b) => a.localeCompare(b, getIntlLocale(), { sensitivity: "base" }))
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

const getTopGames = async (rankBy, limitGames) => {
  const snapshot = await getDocs(
    query(
      collection(db, "game_stats"),
      orderBy(rankBy, "desc"),
      limit(limitGames)
    )
  );

  return statsOf(snapshot)
    .filter((stats) => stats[rankBy] > 0)
    .map((stats) => stats.game);
};

// Una página de posts de una tendencia para /explorar.
// rankBy: "postCount" | "searchCount". La tendencia es un conjunto acotado
// a propósito: los top 20 juegos se piden en la primera página y viajan en
// el cursor, y se pagina dentro de ellos; al agotarse, hasMore es false.
const getTrendingPostsPage = async (rankBy, cursor, pageSize) => {
  const games = cursor?.games ?? await getTopGames(rankBy, EXPLORE_TRENDING_GAMES);

  if (!games.length) {
    return { posts: [], lastVisibleDoc: null, hasMore: false };
  }

  const constraints = [
    where("game", "in", games.slice(0, MAX_IN_VALUES)),
    orderBy("createdAt", "desc")
  ];

  if (cursor?.lastDoc) {
    constraints.push(startAfter(cursor.lastDoc));
  }

  constraints.push(limit(pageSize));

  const snapshot = await getDocs(
    query(collection(db, "posts"), ...constraints)
  );

  const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? cursor?.lastDoc ?? null;

  return {
    posts: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    lastVisibleDoc: { games, lastDoc },
    hasMore: snapshot.docs.length === pageSize
  };
};

export const gameTrendsService = {
  subscribeToTrendingByVolume,
  subscribeToTrendingBySearch,
  subscribeToGames,
  getPostsForGames,
  getTrendingPostsPage
};
