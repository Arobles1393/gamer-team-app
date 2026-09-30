import { memo, useMemo } from "react";
import { getPlatformKey, platformLabels } from "../../utils";

// Badge de plataforma de la card: "PC", "PS5", ... o "MULTI"
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

  const label = multiplatform ? "MULTI" : platformLabels[platform];

  if (!label) return null;

  const title = multiplatform
    ? uniquePlatforms.map((key) => platformLabels[key]).join(" · ")
    : undefined;

  return (
    <span className="post-card__platform" title={title}>
      {label}
    </span>
  );
}

export default memo(PostPlatforms);
