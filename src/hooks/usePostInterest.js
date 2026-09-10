import { useCallback } from "react";
import { interestService } from "../services/posts";

export const usePostInterest = (user, onError) => {

  const handleInterested = useCallback(
    async (post, interestedDoc) => {
      try {
        return await interestService.toggleInterested({
          post,
          interestedDoc,
          user
        });
      } catch (error) {
        onError?.(error);
        return false;
      }
    },
    [user, onError]
  );

  return {
    handleInterested
  };
};