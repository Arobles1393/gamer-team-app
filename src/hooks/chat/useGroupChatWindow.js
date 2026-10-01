import { useEffect, useState } from "react";
import { groupChatService } from "../../services/chat";
import { notificationService } from "../../services/notifications";
import { useLiveMessages } from "./useLiveMessages";

// Espejo de useChatWindow para el chat del grupo de una partida
// (group_chats/{postId}): expone todos los participantes en vez de un
// solo "otro usuario".
export const useGroupChatWindow = (postId, currentUserId) => {
  const [group, setGroup] = useState(undefined);

  // Los últimos 50 mensajes; loadOlder trae más. Si falla es porque ya no
  // hay acceso (dejó de ser participante o el grupo se cerró)
  const { messages, loading, error, retry, hasOlder, loadingOlder, loadOlder } = useLiveMessages(
    groupChatService.subscribeToMessages,
    postId,
    "Error obteniendo mensajes del grupo:"
  );

  useEffect(() => {
    if (!postId) return;

    setGroup(undefined);

    return groupChatService.subscribeToGroupChat(
      postId,
      setGroup,
      (error) => {
        console.error("Error obteniendo el chat del grupo:", error);
        setGroup(null);
      }
    );
  }, [postId]);

  // Con el chat abierto, los mensajes que llegan ya cuentan como leídos
  const receivedCount = messages.filter(
    (message) => message.senderId !== currentUserId
  ).length;

  useEffect(() => {
    if (!postId || !currentUserId) return;

    notificationService
      .markChatNotificationsAsRead(currentUserId, postId, "group_message")
      .catch((error) => {
        console.error("Error marcando mensajes del grupo como leídos:", error);
      });
  }, [postId, currentUserId, receivedCount]);

  const participants = group?.participants ?? [];
  // Sin acceso: el grupo no existe, se cerró o ya no eres participante
  const hasAccess = Boolean(group?.active && participants.includes(currentUserId));

  // Texto, adjunto o ambos
  const sendMessage = async (text, file = null) => {
    if ((!text.trim() && !file) || !hasAccess) return;

    await groupChatService.sendMessage({
      postId,
      senderId: currentUserId,
      participants,
      text: text.trim(),
      file
    });
  };

  return {
    messages,
    loading: loading || group === undefined,
    error,
    retry,
    hasOlder,
    loadingOlder,
    loadOlder,
    participants,
    hasAccess,
    sendMessage
  };
};
