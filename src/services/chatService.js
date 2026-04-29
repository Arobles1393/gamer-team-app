import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase/config";
import { serverTimestamp } from "firebase/firestore";

export const createOrGetChat = async (user1, user2) => {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", user1.uid)
  );

  const snapshot = await getDocs(q);

  let existingChat = null;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.participants.includes(user2.uid)) {
      existingChat = doc.id;
    }
  });

  if (existingChat) return existingChat;

  const docRef = await addDoc(collection(db, "chats"), {
    participants: [user1.uid, user2.uid],
    createdAt: serverTimestamp()
  });

  return docRef.id;
};