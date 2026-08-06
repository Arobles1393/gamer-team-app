import { useMemo, useState } from "react";

const PLATFORM_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "PlayStation", value: "playstation" },
  { label: "Xbox", value: "xbox" },
  { label: "Switch", value: "switch" },
  { label: "PC", value: "pc" },
  { label: "Mobile", value: "mobile" }
];

export const usePostFilters = (posts) => {
  const [filterGame, setFilterGame] = useState(null); //Tentativo cambiar el null a "" en los 2
  const [filterPlatform, setFilterPlatform] = useState(null);

  const gameOptions = useMemo(() => {
    const games = [...new Set(posts.map(post => post.game))];

    return [
      { label: "Todos", value: "" },
      ...games.map(game => ({
        label: game,
        value: game
      }))
    ];
  }, [posts]);

  return {
    filterGame,
    setFilterGame,
    filterPlatform,
    setFilterPlatform,
    gameOptions,
    platformOptions: PLATFORM_OPTIONS
  };
};