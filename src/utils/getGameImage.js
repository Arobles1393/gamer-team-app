const imageCache = {};

export const getGameImage = async (gameName) => {
  const API_KEY = "";

  // 🔥 1. CACHE
  if (imageCache[gameName]) {
    return imageCache[gameName];
  }

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${API_KEY}&search=${gameName}`
    );

    const data = await res.json();

    const image = data.results?.[0]?.background_image;

    // 🔥 guardar en cache
    if (image) {
      imageCache[gameName] = image;
    }

    return image;
  } catch (error) {
    console.error("Error RAWG:", error);
    return null;
  }
};