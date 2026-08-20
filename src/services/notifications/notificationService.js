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
  limit
} from "firebase/firestore";

import { db } from "../../firebase/config";

const subscribeToNotifications = (userId, onChange, onError) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      onChange(notifications);
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

const markAllNotificationsAsRead = async (notifications) => {
  const batch = writeBatch(db);

  notifications
    .filter((notification) => !notification.read)
    .forEach((notification) => {
      batch.update(
        doc(db, "notifications", notification.id),
        {
          read: true
        }
      );
    });

  await batch.commit();
};

const deleteAllNotifications = async (notifications) => {
  const batch = writeBatch(db);

  notifications.forEach((notification) => {
    batch.delete(
      doc(db, "notifications", notification.id)
    );
  });

  await batch.commit();
};

const createNotification = (notificationData) => {
  return addDoc(
    collection(db, "notifications"),
    notificationData
  );
};

export const notificationService = {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  createNotification
};