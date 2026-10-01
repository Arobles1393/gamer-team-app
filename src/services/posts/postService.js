import {
  doc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  limit,
  onSnapshot,
  getDoc,
  setDoc,
  orderBy,
  increment,
  serverTimestamp,
  startAfter,
  writeBatch
} from "firebase/firestore";
import { db, functions } from "../../firebase/config";
import { httpsCallable } from "firebase/functions";
import { gameStatsRef } from "../games/gameStats";
import { groupChatRef, groupChatService } from "../chat/groupChatService";

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
  const [snapshot, groupSnap] = await Promise.all([
    getDoc(postRef),
    getDoc(groupChatRef(postId))
  ]);
  const game = snapshot.data()?.game;

  // El chat del grupo no se borra (sus mensajes son una subcolección):
  // queda inactivo y las reglas cierran el acceso. Va en el mismo batch que
  // el borrado porque la regla comprueba que quien lo cierra es el autor.
  const batch = writeBatch(db);
  if (groupSnap.exists()) {
    batch.update(groupChatRef(postId), { active: false });
  }
  batch.delete(postRef);
  await batch.commit();

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

// El post y el chat de su grupo (con el autor como primer participante) se
// crean en el mismo batch: nunca queda un post sin grupo
const createPost = async (postData) => {
  const postRef = doc(collection(db, "posts"));

  const batch = writeBatch(db);
  batch.set(postRef, {
    ...postData,
    interestedCount: 0
  });
  groupChatService.addGroupChatToBatch(batch, postRef.id, postData.userId);
  await batch.commit();

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
// sortBy: "recent" (createdAt), "mostInterested" (interestedCount) o
// "upcoming" (programados a futuro, el más próximo primero); sin sortBy no
// se ordena (vistas planas que ordenan en el cliente).
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
  } else if (sortBy === "upcoming") {
    constraints.push(...upcomingConstraints());
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

// "Próximamente": solo posts con scheduledAt futuro (los que tienen null o
// ya pasaron quedan fuera por el rango). "now" se fija al consultar; el
// cliente vuelve a filtrar por la hora actual.
const upcomingConstraints = () => [
  where("scheduledAt", ">=", new Date()),
  orderBy("scheduledAt", "asc")
];

// Una página de posts para /explorar (getDocs, no listener).
// sortBy: "recent" | "mostInterested" | "upcoming" | "friends" (con
// friendIds) | "nearby" (con region). cursor = lastVisibleDoc de la página anterior.
// hasMore: si llegó la página completa, puede haber más.
const getPostsPage = async (
  { sortBy, friendIds = [], region },
  cursor,
  pageSize
) => {
  // Sin amigos o sin región no hay nada que consultar ("in" vacío falla)
  if ((sortBy === "friends" && !friendIds.length) || (sortBy === "nearby" && !region)) {
    return { posts: [], lastVisibleDoc: null, hasMore: false };
  }

  const constraints = [];

  if (sortBy === "friends") {
    // Máximo 30 por el operador "in"
    constraints.push(
      where("userId", "in", friendIds.slice(0, MAX_IN_VALUES)),
      orderBy("createdAt", "desc")
    );
  } else if (sortBy === "nearby") {
    constraints.push(
      where("authorRegion", "==", region),
      orderBy("createdAt", "desc")
    );
  } else if (sortBy === "mostInterested") {
    // Igual que en el home: sin interesados no cuenta
    constraints.push(
      where("interestedCount", ">", 0),
      orderBy("interestedCount", "desc")
    );
  } else if (sortBy === "upcoming") {
    constraints.push(...upcomingConstraints());
  } else {
    constraints.push(orderBy("createdAt", "desc"));
  }

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  constraints.push(limit(pageSize));

  const snapshot = await getDocs(
    query(collection(db, "posts"), ...constraints)
  );

  return {
    posts: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    lastVisibleDoc: snapshot.docs[snapshot.docs.length - 1] ?? cursor ?? null,
    hasMore: snapshot.docs.length === pageSize
  };
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
  getPostsPage,
  fetchGameLogo,
  fetchGamePortada
};