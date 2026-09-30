import { doc } from "firebase/firestore";
import { db } from "../../firebase/config";

// game_stats/{id}: el id es el nombre del juego codificado, porque puede
// traer "/" (p. ej. "Fate/Grand Order"), que no es válido en un id de
// Firestore. El nombre real va en el campo `game`. La Cloud Function
// logGameSearch usa la misma codificación.
export const gameStatsRef = (game) =>
  doc(db, "game_stats", encodeURIComponent(game));
