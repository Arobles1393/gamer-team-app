import { useNavigate } from "react-router-dom";
import { chatService } from "../services/chat";

export const useProfileChat = (
  user,
  selectedUserId,
  onClose
) => {
  const navigate = useNavigate();

  const handleChat = async () => {
    const chatId = await chatService.createOrGetChat(
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