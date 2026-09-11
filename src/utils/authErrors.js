export const AUTH_ERROR_MESSAGES = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "El correo no tiene un formato válido.",
  "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
  "auth/user-disabled": "Esta cuenta fue deshabilitada.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres."
};

export const getAuthErrorMessage = (error) =>
  AUTH_ERROR_MESSAGES[error.code] || "Ocurrió un error. Intenta de nuevo.";