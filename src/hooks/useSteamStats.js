import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

export const useSteamStats = (links) => {

  const [steamStats, setSteamStats] = useState(null);
  const [steamID, setSteamId] = useState(null);
  const [loadingSteam, setLoadingSteam] = useState(false);

  useEffect(() => {

    setSteamStats(null);
    setSteamId(null);

    if (!links?.length) {
      return;
    }

    const steamId = getSteamIdFromLinks(links);

    console.log("🔗 Links del usuario:", links);
    console.log("🎮 Steam ID detectado:", steamId);

    if (!steamId) {
      return;
    }

    setSteamId(steamId);
    setLoadingSteam(true);

    const getSteamStats = httpsCallable(
      functions,
      "getSteamStats"
    );

    const fetchSteamStats = async () => {

      try {

        const response = await getSteamStats({
          steamId: String(steamId)
        });

        console.log("📦 Respuesta de getSteamStats:", response.data);

        setSteamStats(response.data);

      } catch (error) {

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

  }, [links]);

  return {
    steamStats,
    steamID,
    loadingSteam
  };
};

const getSteamIdFromLinks = (links) => {

  const steamLink = links.find(
    (link) => link.includes("steamcommunity")
  );

  if (!steamLink) {
    return null;
  }

  const parts = steamLink.split("/");

  return parts[parts.length - 1]
    || parts[parts.length - 2]
    || null;
};