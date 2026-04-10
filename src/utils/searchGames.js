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

    const results = data.results?.map((game) => ({
      label: game.name,
      value: game.name,
      image: game.background_image
    })) || [];

    // guardar en cache
    searchCache[query] = results;

    return results;

  } catch (error) {
    console.error("Error buscando juegos:", error);
    return [];
  }
};