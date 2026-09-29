import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { chatService } from "../services/chat";

export const useProfileChat = (
  user,
  selectedUserId,
  onClose,
  onError
) => {
  const navigate = useNavigate();

  // Abre (o crea) el chat con cualquier usuario, p. ej. desde una card de amigo
  const openChatWith = useCallback(async (otherUserId) => {
    try {
      const chatId = await chatService.createOrGetChat(
        user,
        {
          uid: otherUserId
        }
      );

      navigate("/chat", {
        state: { chatId }
      });

      onClose?.();
    } catch (error) {
      console.error(
        "Error creando u obteniendo el chat:",
        error
      );

      onError?.(
        "No se pudo abrir el chat. Intenta de nuevo."
      );
    }
  }, [user, navigate, onClose, onError]);

  // Chat con el usuario del diálogo de perfil
  const handleChat = () => openChatWith(selectedUserId);

  return { handleChat, openChatWith };
};