import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase/config";

export const useFriendStatus =(
  user,
  selectedUserId
) => {
  const [friendStatus, setFriendStatus] = useState("none");

  useEffect(() => {
    if (!user || !selectedUserId) {
      setFriendStatus("none");
      return;
    }

    let cancelled = false;

    const checkFriendStatus = async () => {
      try {
        const friendsQuery = query(
          collection(db, "friends"),
          where("users", "array-contains", user.uid)
        );

        const friendsSnap = await getDocs(friendsQuery);

        const isFriend = friendsSnap.docs.some(doc =>
          doc.data().users.includes(selectedUserId)
        );

        if (isFriend) {
          if (!cancelled) {
            setFriendStatus("friends");
          }
          return;
        }

        const requestQuery = query(
          collection(db, "friend_requests"),
          where("senderId", "==", user.uid),
          where("receiverId", "==", selectedUserId),
          where("status", "==", "pending")
        );

        const requestSnap = await getDocs(requestQuery);

        if (!requestSnap.empty) {
          if (!cancelled) {
            setFriendStatus("pending");
          }
          return;
        }

        if (!cancelled) {
          setFriendStatus("none");
        }

      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setFriendStatus("none");
        }
      }
    };

    checkFriendStatus();

    return () => {
      cancelled = true;
    };

  }, [user, selectedUserId]);

  return {
    friendStatus,
    setFriendStatus
  };
}