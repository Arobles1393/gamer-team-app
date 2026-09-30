import { useEffect, useState } from "react";
import { userService } from "../../services/users";

// publicOnly: para visitantes sin sesión (lee publicProfiles)
export const useUserProfile = (userId, { publicOnly = false } = {}) => {
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
        },
        { publicOnly }
      );

    return unsubscribe;
  }, [userId, publicOnly]);

  return {
    userData
  };
};