const API_KEY = process.env.REACT_APP_RAWG_API_KEY;

const searchCache = {};

let currentController = null;

export const searchGames = async (query) => {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.trim().toLowerCase();

  // 🔥 cache
  if (searchCache[normalizedQuery]) {
    return searchCache[normalizedQuery];
  }

  // Cancela la búsqueda anterior si seguía en curso
  currentController?.abort();
  currentController = new AbortController();
  const { signal } = currentController;

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(normalizedQuery)}`,
      { signal }
    );

    if (!res.ok) {
      throw new Error(`RAWG respondió ${res.status}`);
    }

    const data = await res.json();

    const results = (data.results || []).map((game) => ({
      id: game.id,
      label: game.name,
      value: game.name,
      image: game.background_image,
      platforms: game.platforms?.map(
        (p) => p.platform.name
      ) || []
    }));

    // guardar en cache
    searchCache[normalizedQuery] = results;

    return results;

  } catch (error) {

    if (error.name === "AbortError") {
      return [];
    }

    console.error("Error buscando juegos:", error);
    return [];
  }
};

// Se llama una sola vez, cuando el usuario selecciona un juego del dropdown
export const getGameDetail = async (gameId) => {

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`
    );

    if (!res.ok) {
      throw new Error(`RAWG respondió ${res.status}`);
    }

    const detailData = await res.json();

    const steamStore = detailData.stores?.find(
      (s) => s.store.slug === "steam"
    );

    let steamAppId = null;

    if (steamStore?.url) {
      const match = steamStore.url.match(/app\/(\d+)/);
      steamAppId = match?.[1] || null;
    }

    return {
      steamAppId,
      clip: detailData.clip?.clip ?? null
    };

  } catch (error) {
    console.error("Error obteniendo detalle del juego:", error);
    return { steamAppId: null, clip: null };
  }
};