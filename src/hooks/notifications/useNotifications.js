import {
  useEffect,
  useState
} from "react";

import { notificationService } from "../../services/notifications";

export const useNotifications = (user, { limitCount = 10 } = {}) => {

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const unsubscribe =
      notificationService.subscribeToNotifications(
        user.uid,
        (data) => {
          setNotifications(data);
          setLoading(false);
        },
        (error) => {
          console.error(
            "Error al obtener notificaciones:",
            error
          );

          setNotifications([]);
          setError(true);
          setLoading(false);
        },
        { limitCount }
      );

    return unsubscribe;

  }, [user, limitCount, retryKey]);

  const retry = () => setRetryKey((key) => key + 1);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    retry
  };
};
