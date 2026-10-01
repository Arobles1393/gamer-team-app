import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("posts");
  const [filterGame, setFilterGame] = useState(null);
  const [filterPlatform, setFilterPlatform] = useState(null);
  // Panel "Más filtros": micrófono, nivel e idioma (null = cualquiera)
  const [filterMic, setFilterMic] = useState(null);
  const [filterSkillLevel, setFilterSkillLevel] = useState(null);
  const [filterLanguage, setFilterLanguage] = useState(null);

  const tagFilters = useMemo(
    () => ({ mic: filterMic, skillLevel: filterSkillLevel, language: filterLanguage }),
    [filterMic, filterSkillLevel, filterLanguage]
  );

  // Cambia una o varias etiquetas a la vez: { mic, skillLevel, language }
  const setTagFilters = useCallback((changes) => {
    if ("mic" in changes) setFilterMic(changes.mic);
    if ("skillLevel" in changes) setFilterSkillLevel(changes.skillLevel);
    if ("language" in changes) setFilterLanguage(changes.language);
  }, []);

  const gameOptions = useMemo(() => {
    const games = [...new Set(gameNames)].filter(Boolean);

    return [
      { label: t("feed.allOption"), value: "" },
      ...games.map(game => ({
        label: game,
        value: game
      }))
    ];
  }, [gameNames, t]);

  return {
    filterGame,
    setFilterGame,
    filterPlatform,
    setFilterPlatform,
    filterMic,
    setFilterMic,
    filterSkillLevel,
    setFilterSkillLevel,
    filterLanguage,
    setFilterLanguage,
    tagFilters,
    setTagFilters,
    gameOptions,
    platformOptions: PLATFORM_OPTIONS
  };
};