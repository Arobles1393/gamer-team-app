import { useEffect } from "react";
import { userService } from "../../services/users";

// Cada cuánto se renueva lastSeen con la pestaña visible. utils/presence
// considera "en línea" a quien escribió en los últimos 5 min: con 2 min hay
// margen aunque se pierda una escritura.
const PRESENCE_INTERVAL_MS = 2 * 60 * 1000;
// Al volver a la pestaña no se escribe si ya se hizo hace menos de esto
const MIN_GAP_MS = 60 * 1000;

// Cada escritura de lastSeen reenvía el documento del usuario a todos los que
// lo están viendo (feed, amigos, chats), así que se escribe solo con la
// pestaña visible y cada 2 min, no cada 30 s.
export const useUserPresence = (user) => {
  useEffect(() => {
    if (!user) return;

    let lastWrite = 0;

    const updatePresence = async () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastWrite < MIN_GAP_MS) return;

      lastWrite = Date.now();

      try {
        await userService.updateUserPresence(user.uid);
      } catch (error) {
        console.error("Error actualizando presencia:", error);
      }
    };

    updatePresence();

    const interval = setInterval(updatePresence, PRESENCE_INTERVAL_MS);
    // Al volver a la pestaña se marca en línea enseguida
    document.addEventListener("visibilitychange", updatePresence);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", updatePresence);
    };
  }, [user]);
};
