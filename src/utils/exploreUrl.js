// /explorar?category=...&platform=...&game=...&mic=...&level=...&lang=...
// sin params vacíos. tags: { mic, skillLevel, language } del panel "Más filtros"
export const buildExploreUrl = ({ category, platform, game, tags = {} }) => {
  const params = new URLSearchParams();

  if (category) params.set("category", category);
  if (platform) params.set("platform", platform);
  if (game) params.set("game", game);
  if (tags.mic === true || tags.mic === false) params.set("mic", tags.mic ? "1" : "0");
  if (tags.skillLevel) params.set("level", tags.skillLevel);
  if (tags.language) params.set("lang", tags.language);

  return `/explorar?${params}`;
};
