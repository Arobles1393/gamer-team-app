import i18n from "../i18n";

// Códigos de error con mensaje propio (texto en locales/{idioma}/auth.json)
const KNOWN_ERRORS = [
  "auth/invalid-credential",
  "auth/invalid-email",
  "auth/too-many-requests",
  "auth/user-disabled",
  "auth/email-already-in-use",
  // Registro y Mi perfil: nombre de usuario de otra cuenta
  "auth/username-taken",
  "auth/weak-password",
  "auth/account-exists-with-different-credential",
  "auth/popup-blocked",
  // Recuperar contraseña y verificación de correo
  "auth/missing-email",
  "auth/requires-recent-login",
  // Eliminar cuenta: confirmar con la contraseña
  "auth/wrong-password",
  "auth/missing-password",
  // loginWithSteam (Cloud Function): Steam no validó la respuesta
  "functions/invalid-argument"
];

// El usuario cerró o reemplazó la ventana del proveedor: es una cancelación, no una falla
const SILENT_AUTH_ERRORS = [
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request"
];

// Devuelve null cuando no hay que mostrar nada
export const getAuthErrorMessage = (error) => {
  if (SILENT_AUTH_ERRORS.includes(error.code)) return null;

  return KNOWN_ERRORS.includes(error.code)
    ? i18n.t(`auth:errors.${error.code}`)
    : i18n.t("common:errors.generic");
};
