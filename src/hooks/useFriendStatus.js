import { useEffect, useState } from "react";
import { friendService } from "../services/friends";

export const useFriendStatus = (user, selectedUserId) => {
  const [friendStatus, setFriendStatus] = useState("none");

  useEffect(() => {
    if (!user || !selectedUserId) {
      setFriendStatus("none");
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const status = await friendService.checkFriendStatus(
          user.uid,
          selectedUserId
        );

        if (!cancelled) {
          setFriendStatus(status);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setFriendStatus("none");
        }
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [user, selectedUserId]);

  return { friendStatus, setFriendStatus };
};