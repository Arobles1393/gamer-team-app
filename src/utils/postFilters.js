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

// Filtros del panel "Más filtros" (null = cualquiera):
// - mic: true = solo los que piden micrófono; false = los que no lo piden
//   (o no lo especifican)
// - skillLevel: "competitive" exacto; "casual" incluye los sin especificar
//   (casual es lo que se da por hecho)
// - language: idioma exacto
export const EMPTY_TAG_FILTERS = { mic: null, skillLevel: null, language: null };

const matchesTags = (post, { mic, skillLevel, language } = EMPTY_TAG_FILTERS) =>
  (mic === null || mic === undefined || (post.requiresMic === true) === mic) &&
  (!skillLevel || (skillLevel === "competitive"
    ? post.skillLevel === "competitive"
    : post.skillLevel !== "competitive")) &&
  (!language || post.language === language);

export const hasTagFilters = (tags = EMPTY_TAG_FILTERS) =>
  tags.mic !== null || Boolean(tags.skillLevel) || Boolean(tags.language);

// Filtros del feed: juego exacto, plataforma, búsqueda por nombre de juego,
// etiquetas (tags) y autores bloqueados (blockedIds)
export const filterPosts = (posts, { game, platform, search, blockedIds, tags } = {}) => {
  const term = search?.trim().toLowerCase();

  return excludeBlockedAuthors(posts, blockedIds).filter((post) =>
    (!game || post.game === game) &&
    (!platform || matchesPlatform(post, platform)) &&
    (!term || post.game?.toLowerCase().includes(term)) &&
    matchesTags(post, tags)
  );
};
