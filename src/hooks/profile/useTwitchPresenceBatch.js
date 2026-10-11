import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVisibleInterval } from "../polling/useVisibleInterval";
import { twitchService } from "../../services/twitch";
import { getTwitchUsernameFromLinks } from "../../utils";

// Cada cuánto se refresca mientras la lista está abierta y la pestaña visible
const REFRESH_MS = 90 * 1000;
// Límite de /helix/streams por llamada
const MAX_USERS = 100;

// Espejo de useSteamPresenceBatch: quién de la lista está en vivo en Twitch,
// con UNA llamada para toda la lista. Va en el componente padre.
// Devuelve { [userId]: { isLive, gameName, title } } solo para quienes
// están en vivo.
export const useTwitchPresenceBatch = (players) => {
  const [presence, setPresence] = useState({});
  // Solo cuenta la respuesta de la última consulta (lista o pestaña cambiadas)
  const requestRef = useRef(0);

  // userId -> usuario de Twitch, solo de quienes lo tienen vinculado
  const usernamesByUser = useMemo(
    () =>
      Object.fromEntries(
        players
          .map((player) => [player.id, getTwitchUsernameFromLinks(player.links)])
          .filter(([, username]) => username)
          .slice(0, MAX_USERS)
      ),
    [players]
  );

  // Clave estable: solo se vuelve a consultar si cambian los usuarios
  const usernamesKey = [...new Set(Object.values(usernamesByUser))].sort().join(",");

  const fetchPresence = useCallback(async () => {
    const requestId = ++requestRef.current;
    try {
      const data = await twitchService.getTwitchPresence(usernamesKey.split(","));
      if (requestId === requestRef.current) setPresence(data || {});
    } catch (error) {
      // Sin dato de Twitch simplemente no se muestra el badge
      console.error("Error al obtener presencia de Twitch:", error);
    }
  }, [usernamesKey]);

  useEffect(() => {
    if (!usernamesKey) setPresence({});
    // La respuesta pendiente ya no corresponde a esta lista
    return () => { requestRef.current += 1; };
  }, [usernamesKey]);

  // Pausa con la pestaña oculta (auditoría B-27)
  useVisibleInterval(fetchPresence, REFRESH_MS, Boolean(usernamesKey));

  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(usernamesByUser)
          .map(([userId, username]) => [userId, presence[username]])
          .filter(([, status]) => status?.isLive)
      ),
    [usernamesByUser, presence]
  );
};
