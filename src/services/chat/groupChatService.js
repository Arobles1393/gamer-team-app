import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { uploadMessageMedia, getAttachmentPreview } from "./messageMedia";

// group_chats/{postId}: chat del grupo de una partida (autor + interesados).
// El id es el del post; los datos del post (juego, autor) no se copian aquí,
// se leen en vivo del post.
export const groupChatRef = (postId) => doc(db, "group_chats", postId);

// Al publicar: el autor es el único participante. Se agrega al batch que
// crea el post (firestore.rules lo valida con getAfter del post)
const addGroupChatToBatch = (batch, postId, ownerId) =>
  batch.set(groupChatRef(postId), {
    postId,
    participants: [ownerId],
    active: true,
    lastMessage: "",
    lastMessageAt: null,
    lastSenderId: null,
    createdAt: serverTimestamp()
  });

const subscribeToGroupChat = (postId, onSuccess, onError) =>
  onSnapshot(
    groupChatRef(postId),
    (snap) => onSuccess(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError
  );

const subscribeToMessages = (postId, onSuccess, onError) => {
  const q = query(
    collection(db, "group_chats", postId, "messages"),
    orderBy("createdAt")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      // "estimate": el mensaje recién enviado ya trae hora aunque el servidor no haya respondido
      onSuccess(snapshot.docs.map((messageDoc) => ({
        id: messageDoc.id,
        ...messageDoc.data({ serverTimestamps: "estimate" })
      })));
    },
    onError
  );
};

// Igual que chatService.sendMessage: el adjunto se sube antes; mensaje,
// notificaciones (a todos los participantes menos quien escribe) y
// lastMessage van en un solo batch
const sendMessage = async ({ postId, senderId, participants, text = "", file }) => {
  const media = file ? await uploadMessageMedia(`group_chats/${postId}`, senderId, file) : null;

  const batch = writeBatch(db);

  batch.set(doc(collection(db, "group_chats", postId, "messages")), {
    text,
    senderId,
    ...(media ?? {}),
    createdAt: serverTimestamp()
  });

  participants
    .filter((uid) => uid !== senderId)
    .forEach((receiverId) => {
      batch.set(doc(collection(db, "notifications")), {
        userId: receiverId,
        senderId,
        type: "group_message",
        read: false,
        createdAt: serverTimestamp(),
        relatedId: postId
      });
    });

  batch.update(groupChatRef(postId), {
    lastMessage: text || getAttachmentPreview(media),
    lastSenderId: senderId,
    lastMessageAt: serverTimestamp()
  });

  await batch.commit();
};

// Grupos activos del usuario, del más reciente al más viejo
const subscribeToMyGroupChats = (userId, onSuccess, onError) => {
  const q = query(
    collection(db, "group_chats"),
    where("active", "==", true),
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onSuccess(snapshot.docs.map((groupDoc) => ({
        id: groupDoc.id,
        ...groupDoc.data({ serverTimestamps: "estimate" })
      })));
    },
    onError
  );
};

export const groupChatService = {
  addGroupChatToBatch,
  subscribeToGroupChat,
  subscribeToMessages,
  sendMessage,
  subscribeToMyGroupChats
};
