import { useEffect } from "react";
import { profileService } from "../../services/profile";

// El correo vive en Firebase Auth; users/{uid}.email es una copia. Al cambiar
// el correo (verifyBeforeUpdateEmail) Auth se actualiza cuando el usuario
// confirma el enlace, fuera de la app: al volver a entrar se corrige la copia.
export const useAccountEmail = (user, userData) => {
  const uid = user?.uid;
  const authEmail = user?.email;
  const storedEmail = userData?.email;
  const hasProfile = Boolean(userData);

  useEffect(() => {
    if (!uid || !authEmail || !hasProfile || storedEmail === authEmail) return;

    profileService.updateUserEmail(uid, authEmail).catch((error) => {
      console.error("Error sincronizando el correo:", error);
    });
  }, [uid, authEmail, storedEmail, hasProfile]);
};
