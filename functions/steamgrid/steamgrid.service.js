const axios = require("axios");
const {createTtlCache} = require("../shared/limits");

class ValidationError extends Error {}

const steamGridApi = axios.create({
  baseURL: "https://www.steamgriddb.com/api/v2",
  timeout: 8000
});

const getAuthHeaders = (apiKey) => ({
  headers: {
    Authorization: `Bearer ${apiKey}`
  }
});

// SteamGridDB no encuentra bien "Resident Evil Requiem" cuando el nombre
// incluye el año/número — se limpia antes de buscar.
const cleanGameName = (gameName) => {
  if (!gameName.toLowerCase().includes("requiem")) {
    return gameName;
  }

  return gameName
    .replace(/\d+/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const searchGame = async (gameName, apiKey) => {
  const searchRes = await steamGridApi.get(
    `/search/autocomplete/${encodeURIComponent(gameName)}`,
    getAuthHeaders(apiKey)
  );

  return searchRes.data.data[0] || null;
};

const fetchGameLogo = async ({ steamAppId, gameName }) => {

  if (!gameName) {
    throw new ValidationError(
      "App ID de Steam y nombre del juego requeridos"
    );
  }

  const apiKey = process.env.STEAMGRID_API_KEY;

  if (!apiKey) {
    throw new Error("API key no configurada");
  }

  const cleanedName = cleanGameName(gameName);

  const game = await searchGame(cleanedName, apiKey);

  if (!game) {
    return { logo: null };
  }

  const logosRes = await steamGridApi.get(
    !steamAppId
      ? `/logos/game/${game.id}`
      : `/logos/steam/${steamAppId}`,
    getAuthHeaders(apiKey)
  );

  const logos = logosRes.data.data;

  const cleanLogo = logos.find(
    (logo) => !logo.nsfw && logo.width > 500
  );

  return {
    logo: cleanLogo?.url || logos[0]?.url || null
  };
};

const fetchGamePortada = async ({ steamAppId, gameName }) => {

  if (!gameName) {
    throw new ValidationError(
      "App ID de Steam y nombre del juego requeridos"
    );
  }

  const apiKey = process.env.STEAMGRID_API_KEY;

  if (!apiKey) {
    throw new Error("API key no configurada");
  }

  const cleanedName = cleanGameName(gameName);

  const game = await searchGame(cleanedName, apiKey);

  if (!game) {
    return { portada: null };
  }

  const portadasRes = await steamGridApi.get(
    !steamAppId
      ? `/grids/game/${game.id}`
      : `/grids/steam/${steamAppId}`,
    getAuthHeaders(apiKey)
  );

  const portadas = portadasRes.data.data;

  return {
    portada: portadas[0]?.url || null
  };
};

// Logos y portadas casi no cambian: 24 h por juego (auditoría M-09)
const mediaCache = createTtlCache({ttlMs: 24 * 60 * 60 * 1000, max: 500});

const cached = (kind, fetcher) => async ({ steamAppId, gameName } = {}) => {
  const key = typeof gameName === "string" ? `${kind}|${steamAppId ?? ""}|${gameName.trim().toLowerCase()}` : null;
  const hit = key && mediaCache.get(key);
  if (hit) return hit;

  const result = await fetcher({ steamAppId, gameName });
  if (key) mediaCache.set(key, result);
  return result;
};

const getGameLogo = cached("logo", fetchGameLogo);
const getGamePortada = cached("portada", fetchGamePortada);

module.exports = {
  getGameLogo,
  getGamePortada,
  ValidationError
};