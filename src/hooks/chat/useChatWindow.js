import { useEffect, useState } from "react";
import { chatService } from "../../services/chat";
import { notificationService } from "../../services/notifications";

export const useChatWindow = (chatId, currentUserId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherUserId, setOtherUserId] = useState(null);

  useEffect(() => {
    if (!chatId) return;

    // Limpia el chat anterior para no mostrar sus mensajes mientras carga el nuevo
    setMessages([]);
    setLoading(true);

    const unsubscribe = chatService.subscribeToMessages(
      chatId,
      (data) => {
        setMessages(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo mensajes:", error);
        setMessages([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [chatId]);

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

  const sendMessage = async (text) => {
    if (!text.trim() || !otherUserId) return;

    await chatService.sendMessage({
      chatId,
      senderId: currentUserId,
      receiverId: otherUserId,
      text: text.trim()
    });
  };

  return {
    messages,
    loading,
    otherUserId,
    sendMessage
  };
};
