import { useMemo } from "react";
import { getPlatformKey } from "../utils";

// Un post multiplataforma aparece en cada plataforma del juego según RAWG.
// Si no tiene esa lista (juego escrito a mano), aparece en todas.
const matchesPlatform = (post, platform) => {
  if (!post.multiplatform) {
    return post.platform === platform;
  }

  if (!post.platforms?.length) {
    return true;
  }

  return post.platforms.some((name) => getPlatformKey(name) === platform);
};

export const useFilteredPosts = (
  posts,
  game,
  platform
) => {
  return useMemo(() => {
    return posts.filter(post => {
      const matchGame =
        !game || post.game === game;

      const matchPlatform =
        !platform || matchesPlatform(post, platform);

      return matchGame && matchPlatform;
    });
  }, [posts, game, platform]);
};
