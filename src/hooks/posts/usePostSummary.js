import { useEffect, useState } from "react";
import { postService } from "../../services/posts";

// Post en vivo para mostrar su juego (chat del grupo, notificaciones, lista
// de chats). A diferencia de usePost, si el post no existe no redirige:
// devuelve null.
export const usePostSummary = (postId) => {
  const [post, setPost] = useState(null);

  useEffect(() => {
    if (!postId) {
      setPost(null);
      return;
    }

    return postService.subscribeToPost(
      postId,
      setPost,
      (error) => {
        console.error("Error obteniendo el post:", error);
        setPost(null);
      }
    );
  }, [postId]);

  return post;
};
