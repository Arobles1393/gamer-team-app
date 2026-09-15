import { useEffect, useState } from "react";
import { friendService } from "../services/friends";

export const useFriends = (user) => {
  const [friendIds, setFriendIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFriendIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = friendService.subscribeToFriends(
      user.uid,
      (ids) => {
        setFriendIds(ids);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo amigos:", error);
        setFriendIds([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return {
    friendIds,
    loading
  };
};