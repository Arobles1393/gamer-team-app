import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Para visitantes sin sesión: requireAuth() los manda al login recordando
// dónde estaban, para regresarlos ahí al iniciar sesión.
// Uso: if (!requireAuth()) return;
export const useRequireAuth = (user) => {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (user) return true;

    navigate("/login", { state: { from: location } });
    return false;
  }, [user, navigate, location]);
};
