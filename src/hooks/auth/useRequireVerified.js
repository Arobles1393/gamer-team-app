import { useCallback } from "react";
import { useEmailVerification } from "../../context/AuthContext";
import { useOpenVerifyPrompt } from "../../context/VerifyPromptContext";
import { useRequireAuth } from "./useRequireAuth";

// Para crear contenido social (publicar, comentar, "Quiero jugar", amistad,
// chats, guías): sin sesión manda al login (useRequireAuth); con el correo
// sin verificar abre "Verifica tu correo para continuar" en vez de dejar
// que la escritura falle en firestore.rules.
// Uso: if (!requireVerified()) return;
export const useRequireVerified = (user) => {
  const requireAuth = useRequireAuth(user);
  const { needsEmailVerification } = useEmailVerification();
  const openPrompt = useOpenVerifyPrompt();

  return useCallback(() => {
    if (!requireAuth()) return false;
    if (needsEmailVerification) {
      openPrompt();
      return false;
    }
    return true;
  }, [requireAuth, needsEmailVerification, openPrompt]);
};
