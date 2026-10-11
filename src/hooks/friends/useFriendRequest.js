import { useCallback } from "react";
import { friendService, FriendRequestRetryError } from "../../services/friends";
import { postAppNotice } from "../../utils/appNotice";
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
      // Rechazada hace menos de 24 h: se explica cuándo se podrá reenviar
      if (error instanceof FriendRequestRetryError) {
        postAppNotice({
          severity: "info",
          summaryKey: "friends:request.retryTitle",
          detailKey: "friends:request.retryDetail",
          detailParams: { count: error.hoursLeft }
        });
        return false;
      }

      console.error(
        "Error al enviar solicitud de amistad:",
        error.code || error.message
      );
      postAppNotice({
        severity: "error",
        summaryKey: "friends:request.errorTitle",
        detailKey: "friends:request.errorDetail"
      });

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