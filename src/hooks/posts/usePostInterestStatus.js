import { useEffect, useState } from "react";
import { interestService } from "../../services/posts";

export const usePostInterestStatus = (postId, userId) => {
  const [interestedUserIds, setInterestedUserIds] = useState([]);
  const [interestedDoc, setInterestedDoc] = useState(null);

  // Quién se interesó no se lee sin sesión (firestore.rules, auditoría M-11)
  useEffect(() => {
    if (!postId || !userId) {
      setInterestedUserIds([]);
      return;
    }

    const unsubscribe = interestService.subscribeToPostInterested(
      postId,
      setInterestedUserIds,
      (error) => {
        console.error("Error obteniendo interesados:", error);
        setInterestedUserIds([]);
      }
    );

    return unsubscribe;
  }, [postId, userId]);

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
