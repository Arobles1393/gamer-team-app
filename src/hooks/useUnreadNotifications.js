import { useEffect, useMemo, useState } from "react";
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

  // Chats con mensajes sin leer (para marcarlos en la lista de chats)
  const unreadChatIds = useMemo(
    () => new Set(
      unread
        .filter((notification) => notification.type === "message")
        .map((notification) => notification.relatedId)
    ),
    [unread]
  );

  return {
    unreadCount: unread.length,
    hasUnreadMessages: unreadChatIds.size > 0,
    unreadChatIds
  };
};
