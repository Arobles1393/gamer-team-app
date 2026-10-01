import { useEffect, useState } from "react";
import { postService } from "../../services/posts";
import i18n from "../../i18n";

export const usePosts = (user, onlyMine = false, joined = false) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Se evalúa en cada render: sigue el idioma actual
  const title = onlyMine
    ? i18n.t("posts:feed.myPosts")
    : joined
      ? i18n.t("posts:feed.myParties")
      : i18n.t("posts:feed.title");

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
