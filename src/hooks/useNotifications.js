import {
  useEffect,
  useState
} from "react";

import { notificationService } from "../services/notifications";

export const useNotifications = (user, { limitCount = 10 } = {}) => {

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {

    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe =
      notificationService.subscribeToNotifications(
        user.uid,
        setNotifications,
        (error) => {
          console.error(
            "Error al obtener notificaciones:",
            error
          );

          setNotifications([]);
        },
        { limitCount }
      );

    return unsubscribe;

  }, [user, limitCount]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return {
    notifications,
    unreadCount
  };
};