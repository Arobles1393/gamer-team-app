import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVisibleInterval } from "../polling/useVisibleInterval";
import { steamStatsService } from "../../services/steam";
import { getSteamIdFromLinks } from "../../utils";

// Cada cuánto se refresca mientras la lista está abierta y la pestaña visible (cuota de la API de Steam)
const REFRESH_MS = 90 * 1000;
// Límite de GetPlayerSummaries por llamada
const MAX_IDS = 100;

// Presencia de Steam de toda una lista de jugadores con UNA llamada.
// Va en el componente padre (Amigos, Buscar jugadores), no en cada card.
// Devuelve { [userId]: "Nombre del juego" } solo para quienes están jugando.
export const useSteamPresenceBatch = (players) => {
  const [presence, setPresence] = useState({});
  // Solo cuenta la respuesta de la última consulta (lista o pestaña cambiadas)
  const requestRef = useRef(0);

  // userId -> identificador de Steam, solo de quienes lo tienen vinculado
  const steamIdsByUser = useMemo(
    () =>
      Object.fromEntries(
        players
          .map((player) => [player.id, getSteamIdFromLinks(player.links)])
          .filter(([, steamId]) => steamId)
          .slice(0, MAX_IDS)
      ),
    [players]
  );

  // Clave estable: solo se vuelve a consultar si cambian los ids
  const idsKey = [...new Set(Object.values(steamIdsByUser))].sort().join(",");

  const fetchPresence = useCallback(async () => {
    const requestId = ++requestRef.current;
    try {
      const data = await steamStatsService.getSteamPresence(idsKey.split(","));
      if (requestId === requestRef.current) setPresence(data || {});
    } catch (error) {
      // Sin dato de Steam simplemente no se muestra la línea
      console.error("Error al obtener presencia de Steam:", error);
    }
  }, [idsKey]);

  useEffect(() => {
    if (!idsKey) setPresence({});
    // La respuesta pendiente ya no corresponde a esta lista
    return () => { requestRef.current += 1; };
  }, [idsKey]);

  // Pausa con la pestaña oculta (auditoría B-27)
  useVisibleInterval(fetchPresence, REFRESH_MS, Boolean(idsKey));

  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(steamIdsByUser)
          .map(([userId, steamId]) => [userId, presence[steamId]?.gameextrainfo])
          .filter(([, game]) => game)
      ),
    [steamIdsByUser, presence]
  );
};
