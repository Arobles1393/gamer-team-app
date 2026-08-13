import { useCallback } from "react";
import { interestService } from "../services/posts";

export const usePostInterest = (user, userData, onError) => {

  const handleInterested = useCallback(
    async (post, interestedDoc) => {
      try {
        return await interestService.toggleInterested({
          post,
          interestedDoc,
          user,
          userData
        });
      } catch (error) {
        onError?.(error);
        return false;
      }
    },
    [user, userData, onError]
  );

  return {
    handleInterested
  };
};