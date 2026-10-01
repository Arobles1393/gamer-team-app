import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";

// Suma una búsqueda al juego (tendencia por búsquedas). Requiere sesión.
const logGameSearch = async (game) => {
  const callable = httpsCallable(
    functions,
    "logGameSearch"
  );

  const response = await callable({ game });

  return response.data;
};

export const gameSearchService = {
  logGameSearch
};
