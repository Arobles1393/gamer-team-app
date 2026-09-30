import { useMemo, useState } from "react";

const PLATFORM_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "PlayStation", value: "playstation" },
  { label: "Xbox", value: "xbox" },
  { label: "Switch", value: "switch" },
  { label: "PC", value: "pc" },
  { label: "Mobile", value: "mobile" }
];

// gameNames: juegos para el filtro (los de la lista en vistas planas, o
// todos los de game_stats en el feed por categorías)
export const usePostFilters = (gameNames) => {
  const [filterGame, setFilterGame] = useState(null);
  const [filterPlatform, setFilterPlatform] = useState(null);

  const gameOptions = useMemo(() => {
    const games = [...new Set(gameNames)].filter(Boolean);

    return [
      { label: "Todos", value: "" },
      ...games.map(game => ({
        label: game,
        value: game
      }))
    ];
  }, [gameNames]);

  return {
    filterGame,
    setFilterGame,
    filterPlatform,
    setFilterPlatform,
    gameOptions,
    platformOptions: PLATFORM_OPTIONS
  };
};