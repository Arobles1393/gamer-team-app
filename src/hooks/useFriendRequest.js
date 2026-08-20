import { useCallback } from "react";
import { friendService } from "../services/friends";

export const useFriendRequest = (
  user,
  userData,
  selectedUserId,
  onSuccess
) => {

  const handleFriendRequest = useCallback(async () => {
    try {
      await friendService.sendFriendRequest(
        user,
        userData,
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
    userData,
    selectedUserId,
    onSuccess
  ]);

  return {
    handleFriendRequest
  };
};