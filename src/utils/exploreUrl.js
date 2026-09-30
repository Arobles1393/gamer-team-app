// /explorar?category=...&platform=...&game=... sin params vacíos
export const buildExploreUrl = ({ category, platform, game }) => {
  const params = new URLSearchParams();

  if (category) params.set("category", category);
  if (platform) params.set("platform", platform);
  if (game) params.set("game", game);

  return `/explorar?${params}`;
};
