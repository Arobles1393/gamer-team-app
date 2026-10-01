import { useEffect, useState } from "react";
import { gameTrendsService } from "../../services/games";

// Juegos con al menos una publicación (game_stats), ordenados por nombre
export const useGames = () => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    return gameTrendsService.subscribeToGames(
      setGames,
      (error) => {
        console.error("Error obteniendo juegos:", error);
        setGames([]);
      }
    );
  }, []);

  return games;
};
