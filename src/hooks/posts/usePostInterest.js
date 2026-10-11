import { useCallback } from "react";
import { interestService } from "../../services/posts";
import { useRequireVerified } from "../auth/useRequireVerified";

export const usePostInterest = (user, onError) => {
  const requireVerified = useRequireVerified(user);


  const handleInterested = useCallback(
    async (post, interestedDoc) => {
      if (!requireVerified()) return false;

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
    [user, onError, requireVerified]
  );

  return {
    handleInterested
  };
};