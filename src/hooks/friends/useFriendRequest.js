import { useCallback } from "react";
import { friendService } from "../../services/friends";
import { useRequireVerified } from "../auth/useRequireVerified";

export const useFriendRequest = (
  user,
  selectedUserId,
  onSuccess
) => {

  const requireVerified = useRequireVerified(user);

  const handleFriendRequest = useCallback(async () => {
    if (!requireVerified()) return false;

    try {
      // "pending", o "friends" si se aceptó una solicitud que ya nos habían enviado
      const status = await friendService.sendFriendRequest(
        user,
        selectedUserId
      );

      onSuccess?.(status);

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
    onSuccess,
    requireVerified
  ]);

  return {
    handleFriendRequest
  };
};