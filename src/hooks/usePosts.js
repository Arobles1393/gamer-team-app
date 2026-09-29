import { useEffect, useState } from "react";
import { postService } from "../services/posts";

export const usePosts = (user, onlyMine = false, joined = false) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const title = onlyMine
    ? "Mis publicaciones"
    : joined
      ? "Mis partidas"
      : "Partidas disponibles";

  useEffect(() => {
    if ((onlyMine || joined) && !user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = postService.subscribeToPosts(
      { userId: user?.uid, onlyMine },
      (data) => {
        setPosts(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo publicaciones:", error);
        setPosts([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, onlyMine, joined]);

  return { posts, title, loading };
};
