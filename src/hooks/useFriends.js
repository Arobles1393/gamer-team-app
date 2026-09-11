import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export const useFriends = (user) => {
  const [friendIds, setFriendIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadFriends = async () => {
      try {
        const q = query(
          collection(db, "friends"),
          where("users", "array-contains", user.uid)
        );

        const snapshot = await getDocs(q);

        const ids = snapshot.docs.map((docSnap) => {
          const users = docSnap.data().users;
          return users.find((uid) => uid !== user.uid);
        });

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