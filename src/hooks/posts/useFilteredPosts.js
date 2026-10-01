import { useMemo } from "react";
import { filterPosts } from "../../utils";

export const useFilteredPosts = (
  posts,
  game,
  platform,
  tags
) => {
  return useMemo(
    () => filterPosts(posts, { game, platform, tags }),
    [posts, game, platform, tags]
  );
};
