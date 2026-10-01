import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  endAt,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { publicProfileRef } from "../profile/publicProfileService";

// Los perfiles de otros usuarios siempre se leen de publicProfiles (lo
// público: nickname, avatar, región, juegos, redes, presencia...).
// users/{uid} tiene además correo, teléfono e idioma: solo lo lee su dueño
// (subscribeToOwnProfile).

// Jugadores cuyo nickname empieza por `search`
const searchUsers = async (search) => {
  const searchLower = search.trim().toLowerCase();

  if (!searchLower) {
    return [];
  }

  const usersQuery = query(
    collection(db, "publicProfiles"),
    orderBy("usernameLower"),
    startAt(searchLower),
    endAt(`${searchLower}\uf8ff`),
    limit(20)
  );

  const snapshot = await getDocs(usersQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
};

const subscribeToDoc = (ref, onSuccess, onError) =>
  onSnapshot(
    ref,
    (docSnap) => {
      if (docSnap.exists()) {
        onSuccess(docSnap.data());
      } else {
        onSuccess(null);
      }
    },
    onError
  );

// Perfil público de cualquier usuario (con o sin sesión)
const subscribeToUserProfile = (userId, onSuccess, onError) =>
  subscribeToDoc(publicProfileRef(userId), onSuccess, onError);

// Perfil completo del usuario actual, con sus datos privados
const subscribeToOwnProfile = (userId, onSuccess, onError) =>
  subscribeToDoc(doc(db, "users", userId), onSuccess, onError);

// lastSeen es público: va a users y a publicProfiles en el mismo batch
const updateUserPresence = async (userId) => {
  const data = { lastSeen: serverTimestamp() };

  const batch = writeBatch(db);
  batch.update(doc(db, "users", userId), data);
  batch.set(publicProfileRef(userId), data, { merge: true });
  await batch.commit();
};

export const userService = {
  searchUsers,
  subscribeToUserProfile,
  subscribeToOwnProfile,
  updateUserPresence
};