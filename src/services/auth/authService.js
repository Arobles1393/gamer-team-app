import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase/config";
import { profileService } from "../profile";

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

export const authService = {
  login,
  register,
  loginWithGoogle
};
