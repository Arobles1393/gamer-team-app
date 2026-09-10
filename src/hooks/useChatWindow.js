import { useEffect, useState } from "react";
import { chatService } from "../services/chat";

export const useChatWindow = (chatId, currentUserId) => {
  const [messages, setMessages] = useState([]);
  const [otherUserId, setOtherUserId] = useState(null);

  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = chatService.subscribeToMessages(
      chatId,
      setMessages,
      (error) => {
        console.error("Error obteniendo mensajes:", error);
        setMessages([]);
      }
    );

    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

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

  const sendMessage = async (text) => {
    if (!text.trim() || !otherUserId) return;

    await chatService.sendMessage({
      chatId,
      senderId: currentUserId,
      receiverId: otherUserId,
      text
    });
  };

  return {
    messages,
    otherUserId,
    sendMessage
  };
};