import { useEffect, useState } from "react";
import { chatService } from "../../services/chat";
import { notificationService } from "../../services/notifications";
import { useLiveMessages } from "./useLiveMessages";

export const useChatWindow = (chatId, currentUserId) => {
  const [otherUserId, setOtherUserId] = useState(null);

  // Los últimos 50 mensajes; loadOlder trae más
  const { messages, loading, hasOlder, loadingOlder, loadOlder } = useLiveMessages(
    chatService.subscribeToMessages,
    chatId,
    "Error obteniendo mensajes:"
  );

  useEffect(() => {
    if (!chatId) return;

    setOtherUserId(null);

    const unsubscribe = chatService.subscribeToChat(
      chatId,
      (chat) => {
        const otherId = chat?.participants?.find(
          (id) => id !== currentUserId
        );
        setOtherUserId(otherId ?? null);
      },
      (error) => {
        console.error("Error obteniendo chat:", error);
        setOtherUserId(null);
      }
    );

    return unsubscribe;
  }, [chatId, currentUserId]);

  // Con el chat abierto, los mensajes que llegan ya cuentan como leídos
  const receivedCount = messages.filter(
    (message) => message.senderId !== currentUserId
  ).length;

  useEffect(() => {
    if (!chatId || !currentUserId) return;

    notificationService
      .markChatNotificationsAsRead(currentUserId, chatId)
      .catch((error) => {
        console.error("Error marcando mensajes como leídos:", error);
      });
  }, [chatId, currentUserId, receivedCount]);

  // Texto, adjunto o ambos
  const sendMessage = async (text, file = null) => {
    if ((!text.trim() && !file) || !otherUserId) return;

    await chatService.sendMessage({
      chatId,
      senderId: currentUserId,
      receiverId: otherUserId,
      text: text.trim(),
      file
    });
  };

  return {
    messages,
    loading,
    hasOlder,
    loadingOlder,
    loadOlder,
    otherUserId,
    sendMessage
  };
};
