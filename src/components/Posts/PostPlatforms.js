import { memo, useMemo } from "react";
import { getPlatformKey, platformIcons } from "../../utils";

function PostPlatforms({
  multiplatform,
  platforms,
  platform
}) {
  const uniquePlatforms = useMemo(
    () =>
      [...new Set(
        (platforms || [])
          .map(getPlatformKey)
          .filter(Boolean)
      )],
    [platforms]
  );

  if (!multiplatform) {
    return platformIcons[platform]?.() ?? null;
  }

  return uniquePlatforms.map((platformKey) => (
    <span key={platformKey}>
      {platformIcons[platformKey]?.()}
    </span>
  ));
}

export default memo(PostPlatforms);