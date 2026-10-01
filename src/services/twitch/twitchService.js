import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";

// Quién de una lista está en vivo en Twitch, en una llamada:
// devuelve { [usuario]: { isLive, gameName, title } }
const getTwitchPresence = async (usernames) => {
  const callable = httpsCallable(
    functions,
    "getTwitchPresence"
  );

  const response = await callable({ usernames });

  return response.data.presence;
};

export const twitchService = {
  getTwitchPresence
};
