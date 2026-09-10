import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";

const subscribeToUserChats = (userId, onSuccess, onError) => {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const chats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      onSuccess(chats);
    },
    onError
  );
};

const createOrGetChat = async (user1, user2) => {
  const chatId = [user1.uid, user2.uid].sort().join("_");

  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [user1.uid, user2.uid],
      lastMessage: "",
      lastMessageAt: null,
      createdAt: serverTimestamp()
    });
  }

  return chatId;
};

export const chatService = {
  createOrGetChat,
  subscribeToUserChats
};