import { getPlatformKey } from "./getPlatformKey";
import { excludeBlockedAuthors } from "./excludeBlocked";

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

// Filtros del feed: juego exacto, plataforma, búsqueda por nombre de juego
// y autores bloqueados (blockedIds)
export const filterPosts = (posts, { game, platform, search, blockedIds } = {}) => {
  const term = search?.trim().toLowerCase();

  return excludeBlockedAuthors(posts, blockedIds).filter((post) =>
    (!game || post.game === game) &&
    (!platform || matchesPlatform(post, platform)) &&
    (!term || post.game?.toLowerCase().includes(term))
  );
};
