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

export const steamStatsService = {
  getSteamStats
};