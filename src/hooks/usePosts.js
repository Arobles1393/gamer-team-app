import { useEffect, useState } from "react";
import { postService } from "../services/posts";

export const usePosts = (user, onlyMine = false, joined = false) => {
  const [posts, setPosts] = useState([]);

  const title = onlyMine
    ? "Mis publicaciones 🎮"
    : joined
      ? "Mis partidas 🎮"
      : "Partidas disponibles 🎮";

  useEffect(() => {
    if ((onlyMine || joined) && !user) {
      setPosts([]);
      return;
    }

    const unsubscribe = postService.subscribeToPosts(
      { userId: user?.uid, onlyMine, joined },
      setPosts,
      (error) => {
        console.error("Error obteniendo publicaciones:", error);
        setPosts([]);
      }
    );

    return unsubscribe;
  }, [user, onlyMine, joined]);

  return { posts, title };
};