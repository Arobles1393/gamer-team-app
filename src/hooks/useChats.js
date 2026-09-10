import { useEffect, useState } from "react";
import { chatService } from "../services/chat";

export const useChats = (user) => {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = chatService.subscribeToUserChats(
      user.uid,
      (data) => {
        setChats(data);
      },
      (error) => {
        console.error("Error obteniendo chats:", error);
        setChats([]);
      }
    );

    return unsubscribe;
  }, [user]);

  return {
    chats
  };
};