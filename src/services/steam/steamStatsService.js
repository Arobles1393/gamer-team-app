import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";

const getSteamStats = async (
  steamId,
  appid
) => {
  const callable = httpsCallable(
    functions,
    "getSteamStats"
  );

  const response = await callable({
    steamId: String(steamId),
    ...(appid && { appid })
  });

  return response.data;
};

// Presencia de varios jugadores en una llamada:
// devuelve { [steamId]: { personastate, gameextrainfo } }
const getSteamPresence = async (steamIds) => {
  const callable = httpsCallable(
    functions,
    "getSteamPresence"
  );

  const response = await callable({ steamIds });

  return response.data.presence;
};

export const steamStatsService = {
  getSteamStats,
  getSteamPresence
};