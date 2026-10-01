import { useEffect, useState } from "react";
import { postService } from "../../services/posts";

// Varios posts en vivo, indexados por id (p. ej. el juego de cada chat de
// grupo en la lista de chats). Un post que ya no existe queda en null.
export const usePostSummaries = (postIds) => {
  const [posts, setPosts] = useState({});

  // Clave estable: solo se re-suscribe si cambian los ids
  const idsKey = [...postIds].sort().join(",");

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];

    setPosts((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([id]) => ids.includes(id)))
    );

    const unsubscribes = ids.map((id) =>
      postService.subscribeToPost(
        id,
        (post) => setPosts((prev) => ({ ...prev, [id]: post })),
        (error) => {
          console.error("Error obteniendo el post:", error);
          setPosts((prev) => ({ ...prev, [id]: null }));
        }
      )
    );

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [idsKey]);

  return posts;
};
