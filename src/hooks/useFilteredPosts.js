import { useMemo } from "react";

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
        !platform || post.platform === platform;

      return matchGame && matchPlatform;
    });
  }, [posts, game, platform]);
};