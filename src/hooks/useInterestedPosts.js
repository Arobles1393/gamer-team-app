import { useEffect, useMemo, useState } from "react";
import { interestService } from "../services/posts";

export const useInterestedPosts = (user) => {
  const [interestedPosts, setInterestedPosts] = useState([]);

  useEffect(() => {
    if (!user) {
      setInterestedPosts([]);
      return;
    }

    const unsubscribe = interestService.subscribeToUserInterests(
      user.uid,
      setInterestedPosts,
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
        interestedPosts.map((item) => [
          `${item.postId}_${item.userId}`,
          item
        ])
      ),
    [interestedPosts]
  );

  return { interestedMap };
};