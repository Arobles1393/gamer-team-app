export const AUTH_ERROR_MESSAGES = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "El correo no tiene un formato válido.",
  "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
  "auth/user-disabled": "Esta cuenta fue deshabilitada.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/account-exists-with-different-credential": "Ya existe una cuenta con ese correo usando otro método de inicio de sesión.",
  "auth/popup-blocked": "Tu navegador bloqueó la ventana emergente. Permite popups para este sitio e intenta de nuevo."
};

// El usuario cerró o reemplazó la ventana de Google: es una cancelación, no una falla
const SILENT_AUTH_ERRORS = [
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request"
];

// Devuelve null cuando no hay que mostrar nada
export const getAuthErrorMessage = (error) => {
  if (SILENT_AUTH_ERRORS.includes(error.code)) return null;
  return AUTH_ERROR_MESSAGES[error.code] || "Ocurrió un error. Intenta de nuevo.";
};
