const axios = require("axios");
const {createTtlCache} = require("../shared/limits");

// Búsqueda de juegos en RAWG desde el servidor (auditoría M-16): la clave
// (RAWG_API_KEY en functions/.env) ya no viaja en el JS de la app.
// Devuelve lo mismo que src/utils/searchGames.js armaba en el navegador.

class ValidationError extends Error {}

const MIN_QUERY = 2;
const MAX_QUERY = 100;
const MAX_RESULTS = 20;

const rawgApi = axios.create({
  baseURL: "https://api.rawg.io/api",
  timeout: 8000,
});

const normalizeQuery = (query) => {
  if (typeof query !== "string") throw new ValidationError("Búsqueda inválida");
  const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized.length < MIN_QUERY || normalized.length > MAX_QUERY) {
    throw new ValidationError("La búsqueda debe tener entre 2 y 100 caracteres");
  }
  return normalized;
};

const normalizeGameId = (gameId) => {
  const id = Number(gameId);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError("Juego inválido");
  return id;
};

// Solo lo que usa la app, con texto acotado
const text = (value, max) => (typeof value === "string" ? value.slice(0, max) : null);

const mapSearchResults = (data) =>
  (Array.isArray(data?.results) ? data.results : [])
      .filter((game) => Number.isInteger(game?.id) && typeof game?.name === "string")
      .slice(0, MAX_RESULTS)
      .map((game) => ({
        id: game.id,
        label: text(game.name, 200),
        value: text(game.name, 200),
        image: text(game.background_image, 1000),
        platforms: (Array.isArray(game.platforms) ? game.platforms : [])
            .map((p) => text(p?.platform?.name, 60))
            .filter(Boolean),
      }));

const mapGameDetail = (data) => {
  const steamStore = (Array.isArray(data?.stores) ? data.stores : [])
      .find((s) => s?.store?.slug === "steam");
  const steamAppId = typeof steamStore?.url === "string" ?
    steamStore.url.match(/app\/(\d+)/)?.[1] ?? null :
    null;

  return {
    steamAppId,
    clip: text(data?.clip?.clip, 1000),
  };
};

const getApiKey = () => {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) throw new Error("RAWG_API_KEY no configurada");
  return apiKey;
};

// Las búsquedas se repiten mucho ("val", "valo"...): 1 h; el detalle casi
// no cambia: 24 h
const searchCache = createTtlCache({ttlMs: 60 * 60 * 1000, max: 1000});
const detailCache = createTtlCache({ttlMs: 24 * 60 * 60 * 1000, max: 1000});

const searchGames = async (query, http = rawgApi) => {
  const normalized = normalizeQuery(query);
  const hit = searchCache.get(normalized);
  if (hit) return hit;

  const res = await http.get("/games", {
    params: {key: getApiKey(), search: normalized, page_size: MAX_RESULTS},
  });
  const results = mapSearchResults(res.data);
  searchCache.set(normalized, results);
  return results;
};

const getGameDetail = async (gameId, http = rawgApi) => {
  const id = normalizeGameId(gameId);
  const hit = detailCache.get(String(id));
  if (hit) return hit;

  const res = await http.get(`/games/${id}`, {params: {key: getApiKey()}});
  const detail = mapGameDetail(res.data);
  detailCache.set(String(id), detail);
  return detail;
};

module.exports = {
  searchGames,
  getGameDetail,
  normalizeQuery,
  normalizeGameId,
  mapSearchResults,
  mapGameDetail,
  ValidationError,
};
