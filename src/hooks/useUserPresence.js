import { useEffect } from "react";
import { userService } from "../services/users";

export const useUserPresence = (user) => {
  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      try {
        await userService.updateUserPresence(
          user.uid
        );
      } catch (error) {
        console.error(
          "Error actualizando presencia:",
          error
        );
      }
    };

    updatePresence();

    const interval = setInterval(
      updatePresence,
      30000
    );

    return () => clearInterval(interval);
  }, [user]);
};