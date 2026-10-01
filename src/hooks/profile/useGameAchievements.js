import { useEffect, useState } from "react";
import { steamStatsService } from "../../services/steam";

// Logros de Steam de un jugador en un juego (se piden al abrir el juego)
export const useGameAchievements = (game, steamId) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!game || !steamId) return;

    let cancelled = false;

    const fetchAchievements = async () => {
      setLoading(true);
      setError(false);

      try {
        const data = await steamStatsService.getSteamStats(steamId, game.appid);

        if (!cancelled) {
          setAchievements(data.achievements || []);
        }
      } catch (err) {
        console.error("Error obteniendo logros:", err);

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAchievements();

    return () => {
      cancelled = true;
    };
  }, [game, steamId]);

  return { achievements, loading, error };
};
