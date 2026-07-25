import { memo, useMemo } from "react";
import { getPlatformKey, platformIcons } from "../../utils";

function PostPlatforms({
  multiplatform,
  platforms,
  platform
}) {
  const uniquePlatforms = useMemo(
    () => [
      ...new Set(
        (platforms ?? [])
          .map(getPlatformKey)
          .filter(Boolean)
      )
    ],
    [platforms]
  );

  const PlatformIcon = platformIcons[platform];

  if (!multiplatform) {
    return PlatformIcon?.() ?? null;
  }

  return (
    <>
      {uniquePlatforms.map((key) => {
        const Icon = platformIcons[key];

        return (
          <span key={key}>
            {Icon?.()}
          </span>
        );
      })}
    </>
  );
}

export default memo(PostPlatforms);