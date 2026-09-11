import { useEffect, useMemo, useState } from "react";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

const mapInterestedPosts = (snapshot) =>
  snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

export const useInterestedPosts = (user) => {
  const [interestedPosts, setInterestedPosts] = useState([]);

  useEffect(() => {
    if (!user) {
      setInterestedPosts([]);
      return;
    }

    const q = query(
      collection(db, "post_interested"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setInterestedPosts(mapInterestedPosts(snapshot));
      },
      (error) => {
        console.error("Error obteniendo interesados:", error);
        setInterestedPosts([]);
      }
    );

    return unsubscribe;
  }, [user]);

  const interestedMap = useMemo(
    () =>
      new Map(
        interestedPosts.map(item => [
          `${item.postId}_${item.userId}`,
          item
        ])
      ),
    [interestedPosts]
  );

  return { interestedMap };
};