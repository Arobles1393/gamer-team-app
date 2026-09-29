import { useEffect, useState } from "react";
import { friendService } from "../services/friends";

export const useFriends = (user) => {
  const [friendIds, setFriendIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setFriendIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const unsubscribe = friendService.subscribeToFriends(
      user.uid,
      (ids) => {
        setFriendIds(ids);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo amigos:", error);
        setFriendIds([]);
        setError(true);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, retryKey]);

  const retry = () => setRetryKey((key) => key + 1);

  return {
    friendIds,
    loading,
    error,
    retry
  };
};
