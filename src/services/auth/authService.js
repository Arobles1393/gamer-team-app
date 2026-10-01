import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithCustomToken, verifyBeforeUpdateEmail } from "firebase/auth";
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

const register = async (
  email,
  password
) => {
  return createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
};

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
      email,
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
      email: null,
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
// lo confirma (y cierra las sesiones abiertas). users.email se sincroniza al
// volver a entrar (useAccountEmail).
const requestEmailChange = (user, newEmail) =>
  verifyBeforeUpdateEmail(user, newEmail);

export const authService = {
  hasPasswordSignIn,
  requestEmailChange,
  login,
  register,
  loginWithGoogle,
  loginWithSteam
};
