import { platformLabels } from "./platformLabels";

// Categorías del feed. Las claves son las mismas en el home y en
// /explorar?category=..., así "Ver más" solo pasa la clave.
export const POST_CATEGORIES = {
  recent: {
    title: "Recientes",
    empty: "Todavía no hay partidas publicadas."
  },
  upcoming: {
    title: "Próximamente",
    // Título fijo, aunque el filtro de plataforma sí se aplica
    fixedTitle: true,
    empty: "No hay partidas programadas próximamente."
  },
  friends: {
    title: "De tus amigos",
    // Personal: el título no cambia con el filtro
    fixedTitle: true,
    requiresUser: true,
    empty: "Aún no tienes amigos con publicaciones."
  },
  nearby: {
    title: "Cerca de ti",
    fixedTitle: true,
    requiresUser: true,
    empty: "No hay publicaciones en tu región todavía."
  },
  mostInterested: {
    title: "Más interesados",
    empty: "Todavía ninguna partida tiene interesados."
  },
  trendingVolume: {
    title: "Tendencia en publicaciones",
    empty: "Todavía no hay juegos en tendencia."
  },
  trendingSearch: {
    title: "Tendencia en búsquedas",
    empty: "Todavía no hay juegos en tendencia por búsquedas."
  }
};

export const isPostCategory = (key) =>
  Object.prototype.hasOwnProperty.call(POST_CATEGORIES, key);

// "Más interesados" o "Más interesados en PC" si hay filtro de plataforma
export const getCategoryTitle = (key, platform) => {
  const category = POST_CATEGORIES[key];
  if (!category) return "";

  return !category.fixedTitle && platform
    ? `${category.title} en ${platformLabels[platform]}`
    : category.title;
};
