import { useEffect, useState } from "react";
import { userService } from "../services/users";

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