// Aviso de bienvenida al crear una cuenta. El registro lo deja pendiente
// justo antes de crearla: en cuanto Firebase inicia la sesión, /login
// redirige y el formulario desaparece, así que el aviso lo muestra la app
// (useWelcomeNotice). sessionStorage puede no estar disponible (modo
// privado): entonces simplemente no hay aviso.
const KEY = "gm-welcome-notice";

export const queueWelcomeNotice = () => {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Sin almacenamiento no hay aviso
  }
};

export const clearWelcomeNotice = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nada que limpiar
  }
};

// true una sola vez si había un aviso pendiente
export const takeWelcomeNotice = () => {
  try {
    const pending = sessionStorage.getItem(KEY) === "1";
    sessionStorage.removeItem(KEY);
    return pending;
  } catch {
    return false;
  }
};
