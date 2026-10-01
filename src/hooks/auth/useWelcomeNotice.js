import { useEffect } from "react";
import { takeWelcomeNotice } from "../../utils/welcomeNotice";

// Muestra la bienvenida pendiente del registro cuando ya hay sesión
// (ver utils/welcomeNotice). onWelcome dibuja el aviso.
export const useWelcomeNotice = (user, onWelcome) => {
  useEffect(() => {
    if (user && takeWelcomeNotice()) {
      onWelcome();
    }
    // Solo al cambiar de usuario: onWelcome puede cambiar en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
};
