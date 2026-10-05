import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";

const callable = httpsCallable(functions, "getCommunityStats");

// Jugadores activos por país (solo conteos agregados, ver
// functions/community). gameId: id de RAWG del juego o null para todos.
// { total, approximate, countries: { [ISO]: { count } | { count: null, masked } }, ready }
const getCommunityStats = async (gameId = null) => {
  const result = await callable(gameId ? { gameId } : {});
  return result.data;
};

export const communityService = {
  getCommunityStats
};
