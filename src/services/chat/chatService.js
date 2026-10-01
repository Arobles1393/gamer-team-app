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
import { uploadMessageMedia, getAttachmentPreview } from "./messageMedia";

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
        ...doc.data({ serverTimestamps: "estimate" })
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
      // "estimate": el mensaje recién enviado ya trae hora aunque el servidor no haya respondido
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data({ serverTimestamps: "estimate" })
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

// Mismo patrón que los adjuntos de comentarios: el senderId va en la ruta
// para que storage.rules valide al dueño
const uploadChatMedia = (chatId, senderId, file) =>
  uploadMessageMedia(`chats/${chatId}`, senderId, file);

// Texto, adjunto o ambos. El archivo se sube ANTES del batch (Storage no
// entra en un batch de Firestore); si la subida falla no se envía nada.
// Mensaje + notificación + metadata del chat siguen siendo atómicos.
const sendMessage = async ({ chatId, senderId, receiverId, text = "", file }) => {
  const media = file ? await uploadChatMedia(chatId, senderId, file) : null;

  const batch = writeBatch(db);

  const messageRef = doc(collection(db, "chats", chatId, "messages"));
  batch.set(messageRef, {
    text,
    senderId,
    ...(media ?? {}),
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
    lastMessage: text || getAttachmentPreview(media),
    lastSenderId: senderId,
    lastMessageAt: serverTimestamp()
  });

  await batch.commit();
};

export const chatService = {
  createOrGetChat,
  subscribeToUserChats,
  subscribeToChat,
  subscribeToMessages,
  uploadChatMedia,
  sendMessage
};