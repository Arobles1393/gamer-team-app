import { useCallback } from "react";
import { friendService } from "../services/friends";

export const useFriendRequest = (
  user,
  selectedUserId,
  onSuccess
) => {

  const handleFriendRequest = useCallback(async () => {
    try {
      await friendService.sendFriendRequest(
        user,
        selectedUserId
      );

      onSuccess?.();

      return true;

    } catch (error) {
      console.error(
        "Error al enviar solicitud de amistad:",
        error
      );

      return false;
    }
  }, [
    user,
    selectedUserId,
    onSuccess
  ]);

  return {
    handleFriendRequest
  };
};