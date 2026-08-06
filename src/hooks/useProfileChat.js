import { useNavigate } from "react-router-dom";
import { createOrGetChat } from "../services/chatService";

export const useProfileChat = (
  user,
  selectedUserId,
  onClose
) => {
  const navigate = useNavigate();

  const handleChat = async () => {
    const chatId = await createOrGetChat(
      user,
      {
        uid: selectedUserId
      }
    );

    navigate("/chat", {
      state: { chatId }
    });

    onClose();
  };

  return { handleChat };
};