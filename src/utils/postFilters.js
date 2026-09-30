import { getPlatformKey } from "./getPlatformKey";

// Un post multiplataforma aparece en cada plataforma del juego según RAWG.
// Si no tiene esa lista (juego escrito a mano), aparece en todas.
const matchesPlatform = (post, platform) => {
  if (!post.multiplatform) {
    return post.platform === platform;
  }

  if (!post.platforms?.length) {
    return true;
  }

  return post.platforms.some((name) => getPlatformKey(name) === platform);
};

// Filtros del feed: juego exacto, plataforma y búsqueda por nombre de juego
export const filterPosts = (posts, { game, platform, search } = {}) => {
  const term = search?.trim().toLowerCase();

  return posts.filter((post) =>
    (!game || post.game === game) &&
    (!platform || matchesPlatform(post, platform)) &&
    (!term || post.game?.toLowerCase().includes(term))
  );
};
