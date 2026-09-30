import { useEffect, useState } from "react";
import { interestService } from "../../services/posts";

export const usePostInterestStatus = (postId, userId) => {
  const [interestedUserIds, setInterestedUserIds] = useState([]);
  const [interestedDoc, setInterestedDoc] = useState(null);

  useEffect(() => {
    if (!postId) return;

    const unsubscribe = interestService.subscribeToPostInterested(
      postId,
      setInterestedUserIds,
      (error) => {
        console.error("Error obteniendo interesados:", error);
        setInterestedUserIds([]);
      }
    );

    return unsubscribe;
  }, [postId]);

  useEffect(() => {
    if (!postId || !userId) return;

    const unsubscribe = interestService.subscribeToUserInterest(
      postId,
      userId,
      setInterestedDoc,
      (error) => {
        console.error("Error obteniendo estado de interés:", error);
        setInterestedDoc(null);
      }
    );

    return unsubscribe;
  }, [postId, userId]);

  return {
    interestedUserIds,
    interestedCount: interestedUserIds.length,
    isInterested: Boolean(interestedDoc),
    interestedDoc
  };
};
