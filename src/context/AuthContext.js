import { createContext, useContext } from "react";
import { useAuth } from "../hooks";

// Separados para que los componentes que solo usan `user` no se re-rendericen
// cada vez que cambia `userData` (por ejemplo, el lastSeen de presencia).
const AuthUserContext = createContext(null);
const UserDataContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user, userData } = useAuth();

  return (
    <AuthUserContext.Provider value={user}>
      <UserDataContext.Provider value={userData}>
        {children}
      </UserDataContext.Provider>
    </AuthUserContext.Provider>
  );
};

// Usuario de Firebase Auth (uid, email...)
export const useCurrentUser = () => useContext(AuthUserContext);

// Documento del usuario en Firestore (username, avatar, links...)
export const useCurrentUserData = () => useContext(UserDataContext);
