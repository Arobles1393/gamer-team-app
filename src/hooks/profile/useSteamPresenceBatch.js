import { useEffect, useMemo, useState } from "react";
import { steamStatsService } from "../../services/steam";
import { getSteamIdFromLinks } from "../../utils";

// Cada cuánto se refresca mientras la lista está abierta (cuota de la API de Steam)
const REFRESH_MS = 90 * 1000;
// Límite de GetPlayerSummaries por llamada
const MAX_IDS = 100;

// Presencia de Steam de toda una lista de jugadores con UNA llamada.
// Va en el componente padre (Amigos, Buscar jugadores), no en cada card.
// Devuelve { [userId]: "Nombre del juego" } solo para quienes están jugando.
export const useSteamPresenceBatch = (players) => {
  const [presence, setPresence] = useState({});

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

  useEffect(() => {
    if (!idsKey) {
      setPresence({});
      return;
    }

    let cancelled = false;

    const fetchPresence = async () => {
      try {
        const data = await steamStatsService.getSteamPresence(idsKey.split(","));

        if (!cancelled) {
          setPresence(data || {});
        }
      } catch (error) {
        // Sin dato de Steam simplemente no se muestra la línea
        console.error("Error al obtener presencia de Steam:", error);
      }
    };

    fetchPresence();
    const interval = setInterval(fetchPresence, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [idsKey]);

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
