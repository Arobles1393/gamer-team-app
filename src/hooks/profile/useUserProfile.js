import { useEffect, useState } from "react";
import { userService } from "../../services/users";

// Perfil público de un usuario, en vivo (publicProfiles: funciona con y sin
// sesión). El perfil propio con sus datos privados es useCurrentUserData.
export const useUserProfile = (userId) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!userId) {
      setUserData(null);
      return;
    }

    const unsubscribe =
      userService.subscribeToUserProfile(
        userId,
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

    return unsubscribe;
  }, [userId]);

  return {
    userData
  };
};