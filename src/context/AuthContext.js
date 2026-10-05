import { createContext, useContext } from "react";
import { useAccountLanguage, useAuth, useEmailVerificationState } from "../hooks";

// Separados para que los componentes que solo usan `user` no se re-rendericen
// cada vez que cambia `userData` (por ejemplo, el lastSeen de presencia).
const AuthUserContext = createContext(null);
const UserDataContext = createContext(null);
const AuthReadyContext = createContext(false);
// Aparte también: solo cambia al verificar el correo (o al cambiar de sesión)
const EmailVerificationContext = createContext({ needsEmailVerification: false, refresh: async () => false });

export const AuthProvider = ({ children }) => {
  const { user, userData, ready } = useAuth();
  // El idioma guardado en la cuenta gana sobre el del navegador
  useAccountLanguage(userData);
  const emailVerification = useEmailVerificationState(user);

  return (
    <AuthUserContext.Provider value={user}>
      <UserDataContext.Provider value={userData}>
        <AuthReadyContext.Provider value={ready}>
          <EmailVerificationContext.Provider value={emailVerification}>
            {children}
          </EmailVerificationContext.Provider>
        </AuthReadyContext.Provider>
      </UserDataContext.Provider>
    </AuthUserContext.Provider>
  );
};

// Usuario de Firebase Auth (uid, email...)
export const useCurrentUser = () => useContext(AuthUserContext);

// Documento del usuario en Firestore (username, avatar, links...)
export const useCurrentUserData = () => useContext(UserDataContext);

// true cuando ya se sabe si hay sesión o no
export const useAuthReady = () => useContext(AuthReadyContext);

// { needsEmailVerification, refresh }: correo sin verificar (cuentas con
// contraseña) y cómo volver a consultarlo
export const useEmailVerification = () => useContext(EmailVerificationContext);
