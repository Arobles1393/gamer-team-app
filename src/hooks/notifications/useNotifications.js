import {
  useEffect,
  useMemo,
  useState
} from "react";

import { notificationService } from "../../services/notifications";
import { excludeBlockedAuthors } from "../../utils";
import { useBlockedIds } from "../blocks/useBlockedIds";

export const useNotifications = (user, { limitCount = 10 } = {}) => {

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const { blockedIds } = useBlockedIds(user);

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

  // Las de usuarios con bloqueo de por medio no se muestran
  const visibleNotifications = useMemo(
    () => excludeBlockedAuthors(notifications, blockedIds, "senderId"),
    [notifications, blockedIds]
  );

  const unreadCount = visibleNotifications.filter(
    (notification) => !notification.read
  ).length;

  return {
    notifications: visibleNotifications,
    unreadCount,
    loading,
    error,
    retry
  };
};
