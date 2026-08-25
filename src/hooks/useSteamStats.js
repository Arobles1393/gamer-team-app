import { useEffect, useState, useMemo } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

export const useSteamStats = (links) => {

  const [steamStats, setSteamStats] = useState(null);
  const [steamID, setSteamId] = useState(null);
  const [loadingSteam, setLoadingSteam] = useState(false);

  const steamId = useMemo(
    () => getSteamIdFromLinks(links),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [links?.find((link) => link.includes("steamcommunity"))]
  );

  useEffect(() => {

    setSteamStats(null);

    if (!steamId) {
      setSteamId(null);
      return;
    }

    setSteamId(steamId);
    setLoadingSteam(true);

    const getSteamStats = httpsCallable(functions, "getSteamStats");

    const fetchSteamStats = async () => {
      try {
        const response = await getSteamStats({ steamId: String(steamId) });
        setSteamStats(response.data);
      } catch (error) {
        if (error.code === "functions/invalid-argument") {
          console.log("Revisa el link de tu perfil de Steam");
        }
        console.error("Error al obtener estadísticas de Steam:", error);
        setSteamStats(null);
      } finally {
        setLoadingSteam(false);
      }
    };

    fetchSteamStats();

  }, [steamId]);

  return {
    steamStats,
    steamID,
    loadingSteam
  };
};

const getSteamIdFromLinks = (links) => {
  const steamLink = links?.find((link) => link.includes("steamcommunity"));

  if (!steamLink) {
    return null;
  }

  const parts = steamLink.split("/");

  return parts[parts.length - 1] || parts[parts.length - 2] || null;
};