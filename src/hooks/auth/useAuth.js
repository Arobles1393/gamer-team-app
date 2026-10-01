import { useEffect, useState } from "react";
import { authService } from "../../services/auth";
import { userService } from "../../services/users";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  // false hasta que Firebase confirma si hay sesión (evita redirigir al login al recargar)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsubscribeUserDoc = null;

    const unsubscribeAuth = authService.subscribeToAuthState(
      (currentUser) => {
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
          unsubscribeUserDoc = null;
        }

        setUser(currentUser);
        setReady(true);

        if (!currentUser) {
          setUserData(null);
          return;
        }

        unsubscribeUserDoc =
          userService.subscribeToOwnProfile(
            currentUser.uid,
            (data) => {
              setUserData(data);
            },
            (error) => {
              console.error(
                "Error al obtener el perfil del usuario:",
                error
              );

              setUserData(null);
            }
          );
      }
    );

    return () => {
      unsubscribeAuth();

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  return {
    user,
    userData,
    ready
  };
};