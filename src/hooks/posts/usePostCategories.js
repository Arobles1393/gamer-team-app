import { useEffect, useMemo, useState } from "react";
import { postService } from "../../services/posts";
import { gameTrendsService } from "../../services/games";
import { filterPosts, platformLabels } from "../../utils";

// Posts visibles por categoría
const ROW_SIZE = 6;
// Posts que se piden a Firestore por categoría. Los filtros (plataforma con
// multiplataforma, búsqueda por substring) no se pueden expresar en una
// consulta, así que se aplican en el cliente sobre esta ventana; con un
// filtro muy estrecho una categoría puede mostrar menos de ROW_SIZE.
const WINDOW_SIZE = 30;
// Juegos que cuentan como tendencia
const TRENDING_GAMES = 6;
// Límite del operador "in" de Firestore: con más amigos solo se consultan
// los primeros 30 (no es común, pero evita que la consulta falle)
const MAX_FRIEND_IDS = 30;

const EMPTY = { posts: [], loading: false };

// Suscripción a una consulta de posts; `options` null = categoría desactivada
const usePostsQuery = (options) => {
  const [state, setState] = useState({ posts: [], loading: Boolean(options) });

  // Clave estable: solo se re-suscribe si cambia la consulta
  const key = options ? JSON.stringify(options) : null;

  useEffect(() => {
    if (!key) {
      setState(EMPTY);
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    return postService.subscribeToPosts(
      JSON.parse(key),
      (posts) => setState({ posts, loading: false }),
      (error) => {
        console.error("Error obteniendo categoría del feed:", error);
        setState(EMPTY);
      }
    );
  }, [key]);

  return state;
};

// Juegos en tendencia (por volumen o por búsquedas) + sus posts recientes
const useTrendingPosts = (subscribeToTrending) => {
  const [games, setGames] = useState(null);
  const [state, setState] = useState({ posts: [], loading: true });

  useEffect(() => {
    return subscribeToTrending(
      TRENDING_GAMES,
      setGames,
      (error) => {
        console.error("Error obteniendo tendencias:", error);
        setGames([]);
      }
    );
  }, [subscribeToTrending]);

  const gamesKey = games ? games.join("\u0000") : null;

  useEffect(() => {
    if (gamesKey === null) return;

    const names = gamesKey ? gamesKey.split("\u0000") : [];

    if (!names.length) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    gameTrendsService.getPostsForGames(names, WINDOW_SIZE)
      .then((posts) => {
        if (!cancelled) setState({ posts, loading: false });
      })
      .catch((error) => {
        console.error("Error obteniendo posts en tendencia:", error);
        if (!cancelled) setState(EMPTY);
      });

    return () => {
      cancelled = true;
    };
  }, [gamesKey]);

  return state;
};

// Feed principal por categorías. Cada sección se consulta por separado y
// todas respetan los filtros activos (juego, plataforma y búsqueda).
// Devuelve las secciones en orden: { key, title, posts, morePosts, loading }.
// Una sección sin posts (o desactivada) se omite en el componente.
export const usePostCategories = ({
  filterGame,
  filterPlatform,
  search,
  friendIds = [],
  userRegion
}) => {
  const recent = usePostsQuery({ sortBy: "recent", limitCount: WINDOW_SIZE });

  const friendsKey = friendIds.slice(0, MAX_FRIEND_IDS).join(",");
  const friends = usePostsQuery(
    friendsKey
      ? { userIds: friendsKey.split(","), sortBy: "recent", limitCount: WINDOW_SIZE }
      : null
  );

  const nearby = usePostsQuery(
    userRegion
      ? { authorRegion: userRegion, sortBy: "recent", limitCount: WINDOW_SIZE }
      : null
  );

  const mostInterested = usePostsQuery({ sortBy: "mostInterested", limitCount: WINDOW_SIZE });

  const trendingByVolume = useTrendingPosts(gameTrendsService.subscribeToTrendingByVolume);
  const trendingBySearch = useTrendingPosts(gameTrendsService.subscribeToTrendingBySearch);

  return useMemo(() => {
    const filters = { game: filterGame, platform: filterPlatform, search };
    const platformSuffix = filterPlatform ? ` en ${platformLabels[filterPlatform]}` : "";

    const section = (key, title, { posts, loading }, extraFilter) => {
      const filtered = filterPosts(extraFilter ? posts.filter(extraFilter) : posts, filters);

      return {
        key,
        title,
        posts: filtered.slice(0, ROW_SIZE),
        morePosts: filtered.slice(ROW_SIZE),
        loading
      };
    };

    return [
      section("recent", `Recientes${platformSuffix}`, recent),
      // Títulos fijos: son personales, no cambian con el filtro
      section("friends", "De tus amigos", friends),
      section("nearby", "Cerca de ti", nearby),
      // Sin interesados no hay nada que destacar
      section("mostInterested", `Más interesados${platformSuffix}`, mostInterested,
        (post) => post.interestedCount > 0),
      section("trendingByVolume", `Tendencia en publicaciones${platformSuffix}`, trendingByVolume),
      section("trendingBySearch", `Tendencia en búsquedas${platformSuffix}`, trendingBySearch)
    ];
  }, [
    filterGame,
    filterPlatform,
    search,
    recent,
    friends,
    nearby,
    mostInterested,
    trendingByVolume,
    trendingBySearch
  ]);
};
