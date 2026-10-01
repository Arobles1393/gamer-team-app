import { useEffect, useState } from "react";
import { groupChatService } from "../../services/chat";

// Chats de grupo activos del usuario (para la lista de chats)
export const useMyGroupChats = (user) => {
  const [groupChats, setGroupChats] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) {
      setGroupChats([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    return groupChatService.subscribeToMyGroupChats(
      user.uid,
      (data) => {
        setGroupChats(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error obteniendo chats de grupo:", err);
        setGroupChats([]);
        setError(true);
        setLoading(false);
      }
    );
  }, [user]);

  return { groupChats, loading, error };
};
