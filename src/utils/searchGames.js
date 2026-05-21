const searchCache = {};

export const searchGames = async (query) => {
  const API_KEY = "";

  // 🔥 evitar llamadas innecesarias
  if (!query || query.length < 2) return [];

  // 🔥 cache
  if (searchCache[query]) {
    return searchCache[query];
  }

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${API_KEY}&search=${query}`
    );

    const data = await res.json();

    const results = await Promise.all(

      (data.results || []).map(async (game) => {

        // 🔥 obtener detalle completo
        const detailRes = await fetch(
          `https://api.rawg.io/api/games/${game.id}?key=${API_KEY}`
        );

        const detailData = await detailRes.json();

        // 🔥 buscar Steam
        const steamStore = detailData.stores?.find(
          (s) => s.store.slug === "steam"
        );

        let steamAppId = null;

        // 🔥 extraer app id
        if (steamStore?.url) {

          const match = steamStore.url.match(/app\/(\d+)/);

          steamAppId = match?.[1] || null;
        }

        return {
          id: game.id,
          label: game.name,
          value: game.name,
          image: game.background_image,
          clip: game.clip?.clip,
          steamAppId
        };
      })

    );

    // guardar en cache
    searchCache[query] = results;

    return results;

  } catch (error) {
    console.error("Error buscando juegos:", error);
    return [];
  }
};