import { useState } from "react";
import { accountService, getSignInMethod } from "../../services/account";
import { getAuthErrorMessage } from "../../utils/authErrors";
import { postAppNotice } from "../../utils/appNotice";
import i18n, { resetAppLanguage } from "../../i18n";

const isRecentLoginError = (error) =>
  error?.code === "auth/requires-recent-login"
  || error?.details?.reason === "requires-recent-login"
  || error?.message === "requires-recent-login";

// Eliminar cuenta: reautentica según el método (contraseña, Google o
// Steam), pide token nuevo y llama a la Cloud Function. Al terminar cierra
// la sesión, limpia lo local y vuelve al inicio con el aviso.
// onError recibe el mensaje a mostrar.
export const useDeleteAccount = (user, onError) => {
  const [deleting, setDeleting] = useState(false);
  const method = getSignInMethod(user);

  const deleteAccount = async ({ password } = {}) => {
    if (!user || deleting) return false;
    setDeleting(true);

    try {
      await accountService.reauthenticate(user, { password });

      try {
        await accountService.deleteAccount();
      } catch (error) {
        // El servidor no aceptó el inicio de sesión: se pide otra vez
        if (!isRecentLoginError(error)) throw error;
        await accountService.reauthenticate(user, { password });
        await accountService.deleteAccount();
      }

      // Sesión y almacenamiento fuera, y recarga completa en el inicio: limpia
      // también lo que quede en memoria (listeners, cachés). Firebase puede
      // cerrar la sesión solo al ver que el usuario ya no existe, y estando en
      // /profile RequireAuth mandaría al login antes de una navegación normal.
      await accountService.clearLocalSession();
      resetAppLanguage();
      postAppNotice(
        { severity: "success", summaryKey: "profile:danger.deletedTitle", detailKey: "profile:danger.deletedDetail" },
        { persist: true }
      );
      window.location.replace("/");
      return true;
    } catch (error) {
      console.error("Error eliminando la cuenta:", error.code || error.message);
      const message = error.code?.startsWith("auth/")
        ? getAuthErrorMessage(error)
        : i18n.t("profile:danger.error");
      if (message) onError?.(message);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteAccount, deleting, method };
};
