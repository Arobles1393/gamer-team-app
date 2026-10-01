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

const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, "users"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
};

const searchUsers = async (search) => {
  const searchLower = search.trim().toLowerCase();

  if (!searchLower) {
    return [];
  }

  const usersQuery = query(
    collection(db, "users"),
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

// publicOnly: lee publicProfiles (nickname, avatar, región), lo único
// que pueden leer los visitantes sin sesión
const subscribeToUserProfile = (
  userId,
  onSuccess,
  onError,
  { publicOnly = false } = {}
) => {
  const userRef = doc(
    db,
    publicOnly ? "publicProfiles" : "users",
    userId
  );

  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onSuccess(docSnap.data());
      } else {
        onSuccess(null);
      }
    },
    onError
  );
};

// lastSeen es público: va a users y a publicProfiles en el mismo batch
const updateUserPresence = async (userId) => {
  const data = { lastSeen: serverTimestamp() };

  const batch = writeBatch(db);
  batch.update(doc(db, "users", userId), data);
  batch.set(publicProfileRef(userId), data, { merge: true });
  await batch.commit();
};

export const userService = {
  getAllUsers,
  searchUsers,
  subscribeToUserProfile,
  updateUserPresence
};