import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";

const getSteamStats = async (steamId) => {
  const callable = httpsCallable(
    functions,
    "getSteamStats"
  );

  const response = await callable({
    steamId: String(steamId)
  });

  return response.data;
};

export const steamStatsService = {
  getSteamStats
};