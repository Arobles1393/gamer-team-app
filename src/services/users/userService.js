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
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebase/config";

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

const subscribeToUserProfile = (
  userId,
  onSuccess,
  onError
) => {
  const userRef = doc(
    db,
    "users",
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

const updateUserPresence = async (userId) => {
  await updateDoc(
    doc(db, "users", userId),
    {
      lastSeen: serverTimestamp()
    }
  );
};

export const userService = {
  getAllUsers,
  searchUsers,
  subscribeToUserProfile,
  updateUserPresence
};