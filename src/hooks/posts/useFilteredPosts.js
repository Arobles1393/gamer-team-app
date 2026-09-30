import { useMemo } from "react";
import { filterPosts } from "../../utils";

export const useFilteredPosts = (
  posts,
  game,
  platform
) => {
  return useMemo(
    () => filterPosts(posts, { game, platform }),
    [posts, game, platform]
  );
};
