import {
  doc,
  deleteDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  limit,
  addDoc,
  onSnapshot,
  getDoc,
  setDoc,
  orderBy,
  increment,
  serverTimestamp
} from "firebase/firestore";
import { db, functions } from "../../firebase/config";
import { httpsCallable } from "firebase/functions";
import { gameStatsRef } from "../games/gameStats";

// Límite del operador "in" de Firestore
const MAX_IN_VALUES = 30;

// Contador de publicaciones por juego (tendencia por volumen). Si falla no
// se revierte el post: la tendencia es secundaria y se corrige con el script
// de backfill.
const stepGamePostCount = async (game, step) => {
  if (!game) return;

  try {
    await setDoc(
      gameStatsRef(game),
      {
        game,
        postCount: increment(step),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error actualizando game_stats:", error);
  }
};

const deletePost = async (postId) => {
  const postRef = doc(db, "posts", postId);

  // Se lee antes de borrar para saber de qué juego descontar
  const snapshot = await getDoc(postRef);
  const game = snapshot.data()?.game;

  await deleteDoc(postRef);
  await stepGamePostCount(game, -1);
};

const getExistingMedia = async (game) => {

  const q = query(
    collection(db, "posts"),
    where("game", "==", game),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return {
      image: null,
      clip: null,
      logo: null,
      portada: null
    };
  }

  const data = snapshot.docs[0].data();

  return {
    image: data.image || null,
    clip: data.clip || null,
    logo: data.logo || null,
    portada: data.portada || null
  };
};

const createPost = async (postData) => {
  const postRef = await addDoc(
    collection(db, "posts"),
    {
      ...postData,
      interestedCount: 0
    }
  );

  await stepGamePostCount(postData.game, 1);

  return postRef;
};


const updatePost = (postId, postData) => {
  return updateDoc(
    doc(db, "posts", postId),
    postData
  );
};

const subscribeToPost = (postId, onSuccess, onError) => {
  return onSnapshot(
    doc(db, "posts", postId),
    (snap) => {
      onSuccess(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    onError
  );
};

// Filtros:
// - onlyMine + userId: posts de un usuario (Mis publicaciones)
// - userIds: posts de varios autores (De tus amigos), máximo 30 por el "in"
// - authorRegion: posts publicados desde una región (Cerca de ti)
// sortBy: "recent" (createdAt) o "mostInterested" (interestedCount); sin
// sortBy no se ordena (vistas planas que ordenan en el cliente).
// Algunas combinaciones necesitan índice compuesto (firestore.indexes.json).
const subscribeToPosts = (
  { userId, onlyMine, userIds, authorRegion, sortBy, limitCount },
  onSuccess,
  onError
) => {
  const constraints = [];

  if (onlyMine) {
    constraints.push(where("userId", "==", userId));
  }

  if (userIds) {
    constraints.push(where("userId", "in", userIds.slice(0, MAX_IN_VALUES)));
  }

  if (authorRegion) {
    constraints.push(where("authorRegion", "==", authorRegion));
  }

  if (sortBy === "recent") {
    constraints.push(orderBy("createdAt", "desc"));
  } else if (sortBy === "mostInterested") {
    constraints.push(orderBy("interestedCount", "desc"));
  }

  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  const q = query(collection(db, "posts"), ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      onSuccess(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    },
    onError
  );
};

const getGameLogo = httpsCallable(
  functions,
  "getGameLogo"
);

const getGamePortada = httpsCallable(
  functions,
  "getGamePortada"
);

const fetchGameLogo = async (
  steamAppId,
  gameName
) => {
  const result = await getGameLogo({
    steamAppId,
    gameName
  });

  return result?.data?.logo ?? null;
};

const fetchGamePortada = async (
  steamAppId,
  gameName
) => {
  const result = await getGamePortada({
    steamAppId,
    gameName
  });

  return result?.data?.portada ?? null;
};

export const postService = {
  deletePost,
  getExistingMedia,
  createPost,
  updatePost,
  subscribeToPost,
  subscribeToPosts,
  fetchGameLogo,
  fetchGamePortada
};