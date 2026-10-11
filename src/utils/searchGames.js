import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

// Búsqueda de juegos en RAWG. Con REACT_APP_RAWG_VIA_FUNCTION=true pasa por
// las Cloud Functions searchRawgGames / getRawgGameDetail y la clave no va en
// el JS de la app (auditoría M-16; necesita Blaze para desplegarse). Sin esa
// variable se llama a RAWG directo con REACT_APP_RAWG_API_KEY, como antes.
const VIA_FUNCTION = process.env.REACT_APP_RAWG_VIA_FUNCTION === "true";
const API_KEY = VIA_FUNCTION ? null : process.env.REACT_APP_RAWG_API_KEY;

const searchCache = new Map();

let currentController = null;
// Por la función no se puede cancelar: solo cuenta la última búsqueda
let latestSearch = 0;

const searchViaFunction = async (normalizedQuery) => {
  const searchId = ++latestSearch;
  try {
    const { data } = await httpsCallable(functions, "searchRawgGames")({ query: normalizedQuery });
    if (searchId !== latestSearch) return null;
    return data?.results || [];
  } catch (error) {
    if (searchId !== latestSearch) return null;
    console.error("Error buscando juegos:", error.code || error.message);
    return [];
  }
};

export const searchGames = async (query) => {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.trim().toLowerCase();

  // 🔥 cache
  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery);
  }

  if (VIA_FUNCTION) {
    const results = await searchViaFunction(normalizedQuery);
    // Una búsqueda que ya quedó atrás vuelve vacía, como las canceladas
    if (results === null) return [];
    if (results.length > 0) searchCache.set(normalizedQuery, results);
    return results;
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
    searchCache.set(normalizedQuery, results);

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

  if (VIA_FUNCTION) {
    try {
      const { data } = await httpsCallable(functions, "getRawgGameDetail")({ gameId });
      return { steamAppId: data?.steamAppId ?? null, clip: data?.clip ?? null };
    } catch (error) {
      console.error("Error obteniendo detalle del juego:", error.code || error.message);
      return { steamAppId: null, clip: null };
    }
  }

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