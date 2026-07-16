import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(data);
    });

    return unsubscribe;
  }, [user]);

  const unreadCount = notifications.filter(
    notification => !notification.read
  ).length;

  return {
    notifications,
    unreadCount
  };
};