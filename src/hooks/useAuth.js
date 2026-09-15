import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { userService } from "../services/users";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    let unsubscribeUserDoc = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
          unsubscribeUserDoc = null;
        }

        setUser(currentUser);

        if (!currentUser) {
          setUserData(null);
          return;
        }

        unsubscribeUserDoc =
          userService.subscribeToUserProfile(
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
    userData
  };
};