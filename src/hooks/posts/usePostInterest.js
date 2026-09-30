import { useCallback } from "react";
import { interestService } from "../../services/posts";
import { useRequireAuth } from "../auth/useRequireAuth";

export const usePostInterest = (user, onError) => {
  const requireAuth = useRequireAuth(user);


  const handleInterested = useCallback(
    async (post, interestedDoc) => {
      if (!requireAuth()) return false;

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
    [user, onError, requireAuth]
  );

  return {
    handleInterested
  };
};