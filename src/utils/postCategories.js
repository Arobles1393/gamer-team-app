import i18n from "../i18n";
import { platformLabels } from "./platformLabels";

// Categorías del feed. Las claves son las mismas en el home y en
// /explorar?category=..., así "Ver más" solo pasa la clave. Título y
// mensaje vacío: posts:categories.{clave}.title / .empty
export const POST_CATEGORIES = {
  recent: {},
  upcoming: {
    // Título fijo, aunque el filtro de plataforma sí se aplica
    fixedTitle: true
  },
  friends: {
    // Personal: el título no cambia con el filtro
    fixedTitle: true,
    requiresUser: true
  },
  nearby: {
    fixedTitle: true,
    requiresUser: true
  },
  mostInterested: {},
  trendingVolume: {},
  trendingSearch: {}
};

export const isPostCategory = (key) =>
  Object.prototype.hasOwnProperty.call(POST_CATEGORIES, key);

export const getCategoryEmptyText = (key) =>
  isPostCategory(key) ? i18n.t(`posts:categories.${key}.empty`) : "";

// "Más interesados" o "Más interesados en PC" si hay filtro de plataforma
export const getCategoryTitle = (key, platform) => {
  const category = POST_CATEGORIES[key];
  if (!category) return "";

  const title = i18n.t(`posts:categories.${key}.title`);

  return !category.fixedTitle && platform
    ? i18n.t("posts:categories.withPlatform", { title, platform: platformLabels[platform] })
    : title;
};
