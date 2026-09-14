import { useEffect, useState } from "react";
import { friendService } from "../services/friends";

export const useFriends = (user) => {
  const [friendIds, setFriendIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadFriends = async () => {
      try {
        const ids = await friendService.getFriendIds(user.uid);
        setFriendIds(ids);
      } catch (error) {
        console.error("Error obteniendo amigos:", error);
        setFriendIds([]);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [user]);

  return { friendIds, loading };
};