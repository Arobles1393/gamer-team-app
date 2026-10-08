import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithCustomToken, verifyBeforeUpdateEmail, sendPasswordResetEmail, sendEmailVerification, onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, googleProvider, functions } from "../../firebase/config";
import i18n from "../../i18n";
import { postAppNotice } from "../../utils/appNotice";
import { REQUIRE_LEGAL_CONSENT } from "../../legal/legalConfig";
import { preferencesService } from "../preferences";
import { profileService } from "../profile";
import { requestSteamOpenIdParams } from "./steamPopup";

const login = async (
  email,
  password
) => {
  return signInWithEmailAndPassword(
    auth,
    email,
    password
  );
};

// Crea la cuenta y su perfil (users + publicProfiles), igual que el primer
// login con Google o Steam. El correo queda solo en Firebase Auth.
// acceptedLegal: marcó "He leído y acepto..." (solo con REQUIRE_LEGAL_CONSENT)
const register = async ({ email, password, username, region, acceptedLegal = false }) => {
  // Nombre único (auditoría M-08): se avisa antes de crear la cuenta, así no
  // queda una cuenta sin perfil. La reserva real va en createUserProfile.
  if (!(await profileService.isUsernameAvailable(username))) {
    throw Object.assign(new Error("auth/username-taken"), { code: "auth/username-taken" });
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await profileService.createUserProfile(userCredential.user.uid, {
    username,
    region
  });

  if (REQUIRE_LEGAL_CONSENT && acceptedLegal) {
    await preferencesService.saveLegalConsent(userCredential.user.uid);
  }

  // Si el correo de verificación no sale, el registro igual termina: se
  // puede reenviar desde el aviso (EmailVerificationBanner)
  sendVerificationEmail(userCredential.user).catch((error) => {
    console.error("Error enviando el correo de verificación:", error.code);
    postAppNotice({ severity: "warn", summaryKey: "auth:verify.sendFailedTitle", detailKey: "auth:verify.sendFailedDetail" });
  });

  return userCredential;
};

// Cambios de sesión (entrar, salir, recargar): devuelve la función para dejar de escuchar
const subscribeToAuthState = (callback) => onAuthStateChanged(auth, callback);

// También avisa cuando se renueva el token (getIdToken(true)): así se
// entera de que el correo ya se verificó sin volver a iniciar sesión
const subscribeToIdToken = (callback) => onIdTokenChanged(auth, callback);

// Correo de verificación en el idioma de la interfaz; el enlace vuelve al inicio
const sendVerificationEmail = (user) => {
  setEmailLanguage();
  return sendEmailVerification(user, { url: `${window.location.origin}/` });
};

// Trae de Firebase el estado actual (p. ej. emailVerified después de abrir
// el enlace) y renueva el token para que las reglas lo vean también.
// forceToken false (revisión automática): solo renueva si ya se verificó
const refreshUser = async (user, { forceToken = true } = {}) => {
  await user.reload();
  if (forceToken || auth.currentUser?.emailVerified) {
    await user.getIdToken(true);
  }
  return auth.currentUser;
};

// Crea el perfil solo en el primer login con Google; si ya existe
// no se toca, para no pisar lo que el usuario haya personalizado.
// Google no da región: queda en null y se completa desde el perfil.
// TODO: el login con Google y Steam también necesitará un paso de
// aceptación de Términos y Privacidad cuando REQUIRE_LEGAL_CONSENT se active.
const loginWithGoogle = async () => {
  const userCredential = await signInWithPopup(
    auth,
    googleProvider
  );

  const { uid, email, displayName, photoURL } = userCredential.user;

  const exists = await profileService.userProfileExists(uid);

  if (!exists) {
    // Si el nombre de Google ya está en uso, se le agrega un número
    await profileService.createUserProfile(uid, {
      username: displayName || email.split("@")[0],
      avatar: photoURL,
      region: null
    }, { autoSuffix: true });
  }

  return userCredential;
};

// Steam usa OpenID 2.0: el popup devuelve la respuesta de Steam, la Cloud
// Function la verifica contra Steam y responde con un custom token.
const loginWithSteam = async () => {
  const params = await requestSteamOpenIdParams();

  const callable = httpsCallable(
    functions,
    "loginWithSteam"
  );

  const { data } = await callable({ params });

  const userCredential = await signInWithCustomToken(
    auth,
    data.customToken
  );

  const { uid } = userCredential.user;

  const exists = await profileService.userProfileExists(uid);

  if (!exists) {
    await profileService.createUserProfile(uid, {
      username: data.username || `steam_${data.steamId64.slice(-6)}`,
      avatar: data.avatar,
      region: null,
      // Activa la sección de Steam del perfil sin que tenga que pegar el link
      links: [`https://steamcommunity.com/profiles/${data.steamId64}`]
    }, { autoSuffix: true });
  }

  return userCredential;
};

// Solo las cuentas con contraseña administran su correo aquí: el de Google
// lo administra Google y las cuentas de Steam no tienen correo
const hasPasswordSignIn = (user) =>
  Boolean(user?.providerData?.some((provider) => provider.providerId === "password"));

// Manda un enlace al correo nuevo; Firebase Auth lo cambia cuando el usuario
// lo confirma (y cierra las sesiones abiertas). Hasta entonces sigue el
// actual. verifyBeforeUpdateEmail (no updateEmail): funciona con la
// protección contra enumeración de correos activada.
const requestEmailChange = (user, newEmail) =>
  verifyBeforeUpdateEmail(user, newEmail);

// Los correos que manda Firebase Auth (restablecer, verificar) salen en el
// idioma de la interfaz
const setEmailLanguage = () => {
  auth.languageCode = i18n.resolvedLanguage || i18n.language || "es";
};

// Enlace para restablecer la contraseña; al terminar vuelve a /login.
// Con la protección contra enumeración de correos, Firebase responde igual
// exista o no la cuenta (y la interfaz también: ver usePasswordReset).
const sendPasswordReset = (email) => {
  setEmailLanguage();
  return sendPasswordResetEmail(auth, email.trim(), { url: `${window.location.origin}/login` });
};

export const authService = {
  hasPasswordSignIn,
  requestEmailChange,
  sendPasswordReset,
  sendVerificationEmail,
  refreshUser,
  subscribeToIdToken,
  subscribeToAuthState,
  login,
  register,
  loginWithGoogle,
  loginWithSteam
};
