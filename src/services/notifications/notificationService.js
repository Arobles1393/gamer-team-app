import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  limit,
  getDocs
} from "firebase/firestore";

import { db } from "../../firebase/config";

const subscribeToNotifications = (
  userId,
  onChange,
  onError,
  { limitCount = 10 } = {}
) => {

  const constraints = [
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  ];

  if (limitCount !== null) {
    constraints.push(limit(limitCount));
  }

  const q = query(...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      onChange(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    },
    onError
  );
};

// Las no leídas más recientes, para el badge y el punto de chats del rail.
// Con un tope: cada mensaje de grupo crea una por participante, así que
// pueden acumularse. El badge muestra "9+" y el panel "99+", así que pasar
// de 100 no cambia nada visible.
const MAX_UNREAD = 100;

const subscribeToUnreadNotifications = (userId, onChange, onError) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("read", "==", false),
    orderBy("createdAt", "desc"),
    limit(MAX_UNREAD)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onChange(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    },
    onError
  );
};

const markNotificationAsRead = (notificationId) => {
  return updateDoc(
    doc(db, "notifications", notificationId),
    {
      read: true
    }
  );
};

const markAllNotificationsAsRead = async (userId) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("read", "==", false)
  );

  const snapshot = await getDocs(q);

  const operations = snapshot.docs.map((docSnap) => ({
    type: "update",
    ref: docSnap.ref
  }));

  await commitInBatches(operations);
};

// Al abrir un chat: sus notificaciones de mensaje dejan de contar como no leídas.
// type: "message" (chat 1:1) o "group_message" (chat del grupo, chatId = postId)
const markChatNotificationsAsRead = async (userId, chatId, type = "message") => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("type", "==", type),
    where("relatedId", "==", chatId),
    where("read", "==", false)
  );

  const snapshot = await getDocs(q);

  const operations = snapshot.docs.map((docSnap) => ({
    type: "update",
    ref: docSnap.ref
  }));

  await commitInBatches(operations);
};

const deleteAllNotifications = async (userId) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  const operations = snapshot.docs.map((docSnap) => ({
    type: "delete",
    ref: docSnap.ref
  }));

  await commitInBatches(operations);
};

const createNotification = (notificationData) => {
  return addDoc(
    collection(db, "notifications"),
    notificationData
  );
};

const updateNotificationStatus = (
  notificationId,
  status
) => {
  return updateDoc(
    doc(db, "notifications", notificationId),
    {
      status,
      read: true
    }
  );
};

const commitInBatches = async (operations) => {
  const batchSize = 500;

  for (
    let i = 0;
    i < operations.length;
    i += batchSize
  ) {
    const batch = writeBatch(db);

    const currentOperations = operations.slice(
      i,
      i + batchSize
    );

    currentOperations.forEach(
      ({ type, ref }) => {
        if (type === "update") {
          batch.update(ref, {
            read: true
          });
        }

        if (type === "delete") {
          batch.delete(ref);
        }
      }
    );

    await batch.commit();
  }
};

export const notificationService = {
  subscribeToNotifications,
  subscribeToUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markChatNotificationsAsRead,
  deleteAllNotifications,
  createNotification,
  updateNotificationStatus
};