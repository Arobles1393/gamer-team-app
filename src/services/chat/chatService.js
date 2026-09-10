import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  writeBatch
} from "firebase/firestore";
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

const subscribeToChat = (chatId, onSuccess, onError) => {
  return onSnapshot(
    doc(db, "chats", chatId),
    (snap) => {
      onSuccess(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    onError
  );
};

const subscribeToMessages = (chatId, onSuccess, onError) => {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      onSuccess(messages);
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

const sendMessage = async ({ chatId, senderId, receiverId, text }) => {
  const batch = writeBatch(db);

  const messageRef = doc(collection(db, "chats", chatId, "messages"));
  batch.set(messageRef, {
    text,
    senderId,
    createdAt: serverTimestamp()
  });

  const notificationRef = doc(collection(db, "notifications"));
  batch.set(notificationRef, {
    userId: receiverId,
    senderId,
    type: "message",
    read: false,
    createdAt: serverTimestamp(),
    relatedId: chatId
  });

  const chatRef = doc(db, "chats", chatId);
  batch.update(chatRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp()
  });

  await batch.commit();
};

export const chatService = {
  createOrGetChat,
  subscribeToUserChats,
  subscribeToChat,
  subscribeToMessages,
  sendMessage
};