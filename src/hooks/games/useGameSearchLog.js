import { useEffect } from "react";
import { gameSearchService } from "../../services/games";

// Mismo debounce que la búsqueda de juegos y de jugadores
const DEBOUNCE_MS = 300;

// Juego al que apunta la búsqueda: coincidencia exacta o, si no, el único
// juego conocido que contiene el texto. Si es ambiguo no se cuenta nada,
// para no inflar juegos que solo coinciden a medias.
const resolveSearchedGame = (term, games) => {
  const text = term.trim().toLowerCase();
  if (text.length < 2) return null;

  const exact = games.find((game) => game.toLowerCase() === text);
  if (exact) return exact;

  const matches = games.filter((game) => game.toLowerCase().includes(text));
  return matches.length === 1 ? matches[0] : null;
};

// Registra la búsqueda (tendencia por búsquedas) cuando el usuario deja de
// escribir, nunca en cada tecla. También cuenta el juego elegido en el
// filtro. Sin sesión no se registra (la Cloud Function la exige).
export const useGameSearchLog = ({ user, search, filterGame, games }) => {
  const searchedGame = resolveSearchedGame(search || "", games);
  const game = filterGame || searchedGame;

  useEffect(() => {
    if (!user || !game) return;

    const timeout = setTimeout(() => {
      gameSearchService.logGameSearch(game).catch((error) => {
        console.error("Error registrando búsqueda:", error);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [user, game]);
};
