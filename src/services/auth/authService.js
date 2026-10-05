import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithCustomToken, verifyBeforeUpdateEmail, onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, googleProvider, functions } from "../../firebase/config";
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
const register = async ({ email, password, username, region }) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await profileService.createUserProfile(userCredential.user.uid, {
    username,
    region
  });

  return userCredential;
};

// Cambios de sesión (entrar, salir, recargar): devuelve la función para dejar de escuchar
const subscribeToAuthState = (callback) => onAuthStateChanged(auth, callback);

// Crea el perfil solo en el primer login con Google; si ya existe
// no se toca, para no pisar lo que el usuario haya personalizado.
// Google no da región: queda en null y se completa desde el perfil.
const loginWithGoogle = async () => {
  const userCredential = await signInWithPopup(
    auth,
    googleProvider
  );

  const { uid, email, displayName, photoURL } = userCredential.user;

  const exists = await profileService.userProfileExists(uid);

  if (!exists) {
    await profileService.createUserProfile(uid, {
      username: displayName || email.split("@")[0],
      avatar: photoURL,
      region: null
    });
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
    });
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

export const authService = {
  hasPasswordSignIn,
  requestEmailChange,
  subscribeToAuthState,
  login,
  register,
  loginWithGoogle,
  loginWithSteam
};
