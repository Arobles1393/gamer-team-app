import { useEffect, useState } from "react";
import { notificationService } from "../services/notifications";

// Conteo de no leídas y si hay mensajes sin leer, sin el límite de la lista del overlay
export const useUnreadNotifications = (user) => {
  const [unread, setUnread] = useState([]);

  useEffect(() => {
    if (!user) {
      setUnread([]);
      return;
    }

    const unsubscribe = notificationService.subscribeToUnreadNotifications(
      user.uid,
      setUnread,
      (error) => {
        console.error("Error obteniendo notificaciones sin leer:", error);
        setUnread([]);
      }
    );

    return unsubscribe;
  }, [user]);

  return {
    unreadCount: unread.length,
    hasUnreadMessages: unread.some((notification) => notification.type === "message")
  };
};
