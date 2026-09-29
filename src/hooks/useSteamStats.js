import {
  useEffect,
  useState
} from "react";
import { steamStatsService } from "../services/steam";

export const useSteamStats = (links) => {

  const [steamStats, setSteamStats] = useState(null);
  const [loadingSteam, setLoadingSteam] = useState(false);
  // Hay link de Steam pero no se pudo leer (perfil privado, link inválido, emulador apagado…)
  const [steamError, setSteamError] = useState(false);

  const steamLink = links?.find(
    (link) => link.includes("steamcommunity")
  );

  const steamId = getSteamIdFromLinks(steamLink);

  useEffect(() => {

    setSteamStats(null);
    setSteamError(false);

    if (!steamId) {
      setLoadingSteam(false);
      return;
    }

    setLoadingSteam(true);

    // Evita que una respuesta de un steamId anterior pise la actual
    let cancelled = false;

    const fetchSteamStats = async () => {
      try {
        const data =
          await steamStatsService.getSteamStats(
            steamId
          );

        if (!cancelled) {
          setSteamStats(data);
        }

      } catch (error) {

        if (
          error.code ===
          "functions/invalid-argument"
        ) {
          console.warn(
            "Revisa el link de tu perfil de Steam:",
            error.message
          );
        } else {
          console.error(
            "Error al obtener estadísticas de Steam:",
            error
          );
        }

        if (!cancelled) {
          setSteamStats(null);
          setSteamError(true);
        }

      } finally {
        if (!cancelled) {
          setLoadingSteam(false);
        }
      }
    };

    fetchSteamStats();

    return () => {
      cancelled = true;
    };

  }, [steamId]);

  return {
    steamStats,
    steamID: steamId,
    loadingSteam,
    steamError
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
