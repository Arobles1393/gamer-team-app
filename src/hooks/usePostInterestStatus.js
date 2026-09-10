import { useEffect, useState } from "react";
import { interestService } from "../services/posts";

export const usePostInterestStatus = (postId, userId) => {
  const [interestedCount, setInterestedCount] = useState(0);
  const [interestedDoc, setInterestedDoc] = useState(null);

  useEffect(() => {
    if (!postId) return;

    const unsubscribe = interestService.subscribeToInterestCount(
      postId,
      setInterestedCount,
      (error) => {
        console.error("Error obteniendo conteo de interesados:", error);
        setInterestedCount(0);
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
    interestedCount,
    isInterested: Boolean(interestedDoc),
    interestedDoc
  };
};