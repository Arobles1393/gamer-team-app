import { useState } from "react";
import { authService } from "../../services/auth";
import { getAuthErrorMessage } from "../../utils/authErrors";
import { useCooldown } from "./useCooldown";

// "No existe esa cuenta" se trata como éxito: el mensaje es el mismo exista
// o no el correo, para no revelar quién está registrado
const SAME_AS_SUCCESS = ["auth/user-not-found"];

// Recuperar contraseña: envía el enlace y bloquea el botón 60 s.
// sent: ya se mandó (muestra el aviso genérico). onError recibe el mensaje.
export const usePasswordReset = (onError) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const cooldown = useCooldown(60);

  const send = async (email) => {
    if (sending || cooldown.active) return;
    setSending(true);

    try {
      await authService.sendPasswordReset(email);
      setSent(true);
      cooldown.start();
    } catch (error) {
      if (SAME_AS_SUCCESS.includes(error.code)) {
        setSent(true);
        cooldown.start();
      } else {
        onError?.(getAuthErrorMessage(error));
      }
    } finally {
      setSending(false);
    }
  };

  return { send, sending, sent, cooldown: cooldown.remaining };
};
