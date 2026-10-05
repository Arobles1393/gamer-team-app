import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { chatService } from "../../services/chat";
import i18n from "../../i18n";
import { useRequireVerified } from "../auth/useRequireVerified";

export const useProfileChat = (
  user,
  selectedUserId,
  onClose,
  onError
) => {
  const navigate = useNavigate();
  const requireVerified = useRequireVerified(user);

  // Abre (o crea) el chat con cualquier usuario, p. ej. desde una card de amigo
  const openChatWith = useCallback(async (otherUserId) => {
    if (!requireVerified()) return;

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
        i18n.t("chat:window.openError")
      );
    }
  }, [user, navigate, onClose, onError, requireVerified]);

  // Chat con el usuario del diálogo de perfil
  const handleChat = () => openChatWith(selectedUserId);

  return { handleChat, openChatWith };
};