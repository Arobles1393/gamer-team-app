import { useEffect, useState } from "react";
import { userService } from "../../services/users";

// Perfil público de un usuario, en vivo (publicProfiles: funciona con y sin
// sesión). El perfil propio con sus datos privados es useCurrentUserData.
// missing: ya se consultó y el perfil no existe (cuenta eliminada); mientras
// carga, userData es null y missing false.
export const useUserProfile = (userId) => {
  const [userData, setUserData] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setUserData(null);
    setMissing(false);

    if (!userId) {
      return;
    }

    const unsubscribe =
      userService.subscribeToUserProfile(
        userId,
        (data) => {
          setUserData(data);
          setMissing(!data);
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
    userData,
    missing
  };
};
