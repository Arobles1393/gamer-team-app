import { useEffect, useState } from "react";
import { chatService } from "../../services/chat";

export const useChats = (user) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const unsubscribe = chatService.subscribeToUserChats(
      user.uid,
      (data) => {
        setChats(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo chats:", error);
        setChats([]);
        setError(true);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, retryKey]);

  const retry = () => setRetryKey((key) => key + 1);

  return {
    chats,
    loading,
    error,
    retry
  };
};
