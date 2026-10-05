import { httpsCallable } from "firebase/functions";
import { EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, signOut } from "firebase/auth";
import { auth, functions, googleProvider } from "../../firebase/config";
import { authService } from "../auth";

const callable = httpsCallable(functions, "deleteAccount");

// Método con el que entra la cuenta: "password", "google" o "steam".
// Steam usa custom token: sin providerData o con uid "steam:..."
export const getSignInMethod = (user) => {
  const providers = user?.providerData?.map((provider) => provider.providerId) ?? [];
  if (!providers.length || user?.uid?.startsWith("steam:")) return "steam";
  if (providers.includes("password")) return "password";
  if (providers.includes("google.com")) return "google";
  return "steam";
};

// Volver a iniciar sesión justo antes de borrar (el servidor exige que el
// inicio de sesión sea de hace menos de 5 minutos)
const reauthenticate = async (user, { password } = {}) => {
  const method = getSignInMethod(user);
  if (method === "password") {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  } else if (method === "google") {
    await reauthenticateWithPopup(user, googleProvider);
  } else {
    // Steam: se repite el inicio de sesión con Steam (token nuevo, mismo uid)
    await authService.loginWithSteam();
  }
  // Token nuevo con auth_time actualizado para la Cloud Function
  await auth.currentUser.getIdToken(true);
};

// Borra la cuenta en el servidor (Cloud Function deleteAccount)
const deleteAccount = async () => {
  const result = await callable({});
  return result.data;
};

// Sesión y datos locales de la cuenta borrada
const clearLocalSession = async () => {
  await signOut(auth).catch(() => {});
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // Sin almacenamiento no hay nada que limpiar
  }
};

export const accountService = {
  reauthenticate,
  deleteAccount,
  clearLocalSession
};
