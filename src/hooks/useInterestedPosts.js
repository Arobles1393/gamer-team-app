import { useEffect, useMemo, useState } from "react";
import { onSnapshot, collection } from "firebase/firestore";
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

    const unsubscribe = onSnapshot(
      collection(db, "post_interested"),
      (snapshot) => {
        setInterestedPosts(mapInterestedPosts(snapshot));
      },
      (error) => {
        console.error(
          "Error obteniendo interesados:",
          error
        );
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