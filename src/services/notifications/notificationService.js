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

const subscribeToNotifications = (userId, onChange, onError, { limitCount = 10 } = {}) => {
  const constraints = [
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  ];

  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  const q = query(...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      onChange(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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

  const batch = writeBatch(db);

  snapshot.forEach((docSnap) => {
    batch.update(docSnap.ref, { read: true });
  });

  await batch.commit();
};

const deleteAllNotifications = async (userId) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  const batch = writeBatch(db);

  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();
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

export const notificationService = {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  createNotification,
  updateNotificationStatus
};