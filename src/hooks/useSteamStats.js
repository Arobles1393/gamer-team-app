import {
  useEffect,
  useState
} from "react";
import { steamStatsService } from "../services/steam";

export const useSteamStats = (links) => {

  const [steamStats, setSteamStats] = useState(null);
  const [loadingSteam, setLoadingSteam] = useState(false);

  const steamLink = links?.find(
    (link) => link.includes("steamcommunity")
  );

  const steamId = getSteamIdFromLinks(steamLink);

  useEffect(() => {

    setSteamStats(null);

    if (!steamId) {
      return;
    }

    setLoadingSteam(true);

    const fetchSteamStats = async () => {
      try {
        const data =
          await steamStatsService.getSteamStats(
            steamId
          );

        setSteamStats(data);

      } catch (error) {

        if (
          error.code ===
          "functions/invalid-argument"
        ) {
          console.log(
            "Revisa el link de tu perfil de Steam"
          );
        }

        console.error(
          "Error al obtener estadísticas de Steam:",
          error
        );

        setSteamStats(null);

      } finally {
        setLoadingSteam(false);
      }
    };

    fetchSteamStats();

  }, [steamId]);

  return {
    steamStats,
    steamID: steamId,
    loadingSteam
  };
};

const getSteamIdFromLinks = (steamLink) => {
  if (!steamLink) {
    return null;
  }

  const parts = steamLink.split("/");

  return (
    parts[parts.length - 1] ||
    parts[parts.length - 2] ||
    null
  );
};