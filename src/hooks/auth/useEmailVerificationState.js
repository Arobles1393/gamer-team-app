import { useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "../../services/auth";

// Estado de verificación del correo de la sesión. user.emailVerified no
// cambia de referencia tras user.reload(), así que se guarda en estado y se
// actualiza con onIdTokenChanged (refresh() renueva el token).
// needsEmailVerification: false para Steam (sin correo) y Google (ya viene
// verificado). Lo usa AuthProvider en su propio contexto.
export const useEmailVerificationState = (user) => {
  const [verified, setVerified] = useState(Boolean(user?.emailVerified));

  useEffect(() => {
    setVerified(Boolean(user?.emailVerified));
  }, [user]);

  useEffect(() => authService.subscribeToIdToken((current) => {
    setVerified(Boolean(current?.emailVerified));
  }), []);

  // true si ya está verificado (después de abrir el enlace del correo)
  const refresh = useCallback(async ({ forceToken = true } = {}) => {
    if (!user) return false;
    const current = await authService.refreshUser(user, { forceToken });
    const isVerified = Boolean(current?.emailVerified);
    setVerified(isVerified);
    return isVerified;
  }, [user]);

  const needsEmailVerification = Boolean(user?.email) && !verified;

  return useMemo(
    () => ({ needsEmailVerification, refresh }),
    [needsEmailVerification, refresh]
  );
};
