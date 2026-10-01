import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { postService } from "../../services/posts";
import { gameTrendsService } from "../../services/games";
import { collectFilteredPage, excludeBlockedAuthors } from "../../utils";

const PAGE_SIZE = 15;

// Página cruda de Firestore según la categoría de /explorar
const createFetcher = ({ category, friendIds, region }) => {
  switch (category) {
    case "trendingVolume":
      return (cursor) => gameTrendsService.getTrendingPostsPage("postCount", cursor, PAGE_SIZE);
    case "trendingSearch":
      return (cursor) => gameTrendsService.getTrendingPostsPage("searchCount", cursor, PAGE_SIZE);
    case "friends":
      return (cursor) => postService.getPostsPage({ sortBy: "friends", friendIds }, cursor, PAGE_SIZE);
    case "nearby":
      return (cursor) => postService.getPostsPage({ sortBy: "nearby", region }, cursor, PAGE_SIZE);
    case "mostInterested":
      return (cursor) => postService.getPostsPage({ sortBy: "mostInterested" }, cursor, PAGE_SIZE);
    default:
      return (cursor) => postService.getPostsPage({ sortBy: "recent" }, cursor, PAGE_SIZE);
  }
};

// Posts de una categoría de /explorar, 15 por página con "Cargar más".
// `ready` false mientras faltan datos del usuario (amigos, región): no
// consulta hasta tenerlos. Al cambiar la categoría o un filtro se reinicia
// desde la primera página.
export const usePaginatedPosts = ({
  category,
  platform,
  game,
  friendIds = [],
  region,
  blockedIds = [],
  ready = true
}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);

  const cursorRef = useRef(null);
  const busyRef = useRef(false);
  // Descarta respuestas de una combinación anterior de filtros
  const requestRef = useRef(0);

  // Clave estable de la consulta
  const friendsKey = friendIds.slice(0, 30).join(",");
  const queryKey = JSON.stringify({ category, platform, game, friendsKey, region });

  const load = useCallback(async (reset) => {
    if (busyRef.current && !reset) return;

    const { category: cat, platform: plat, game: gm, friendsKey: friends, region: reg } =
      JSON.parse(queryKey);

    const requestId = ++requestRef.current;
    busyRef.current = true;
    setError(false);

    if (reset) {
      cursorRef.current = null;
      setPosts([]);
      setHasMore(false);
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const page = await collectFilteredPage({
        fetchRawPage: createFetcher({
          category: cat,
          friendIds: friends ? friends.split(",") : [],
          region: reg
        }),
        cursor: cursorRef.current,
        filters: { platform: plat, game: gm },
        pageSize: PAGE_SIZE
      });

      if (requestId !== requestRef.current) return;

      cursorRef.current = page.cursor;
      // Se concatenan: "Cargar más" no reemplaza lo ya cargado
      setPosts((prev) => (reset ? page.posts : [...prev, ...page.posts]));
      setHasMore(page.hasMore);
    } catch (err) {
      if (requestId !== requestRef.current) return;

      console.error("Error cargando publicaciones:", err);
      setError(true);
    } finally {
      if (requestId === requestRef.current) {
        busyRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [queryKey]);

  useEffect(() => {
    if (!ready) {
      setLoading(true);
      return;
    }

    load(true);
  }, [ready, load]);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    load(false);
  }, [hasMore, load]);

  const retry = useCallback(() => load(true), [load]);

  // Quita un post borrado desde esta vista sin recargar la lista
  const removePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  // Autores bloqueados: se ocultan de lo ya cargado sin volver a paginar
  const visiblePosts = useMemo(
    () => excludeBlockedAuthors(posts, blockedIds),
    [posts, blockedIds]
  );

  return {
    posts: visiblePosts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    retry,
    removePost
  };
};
