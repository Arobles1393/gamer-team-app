import { useNavigate } from "react-router-dom";
import { chatService } from "../services/chat";

export const useProfileChat = (
  user,
  selectedUserId,
  onClose,
  onError
) => {
  const navigate = useNavigate();

  const handleChat = async () => {
    try {
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
    } catch (error) {
      console.error(
        "Error creando u obteniendo el chat:",
        error
      );

      onError?.(
        "No se pudo abrir el chat. Intenta de nuevo."
      );
    }
  };

  return { handleChat };
};