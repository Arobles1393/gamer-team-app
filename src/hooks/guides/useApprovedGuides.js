import { useEffect, useMemo, useState } from "react";
import { guideService } from "../../services/guides";
import { excludeBlockedAuthors } from "../../utils";
import { useBlockedIds } from "../blocks/useBlockedIds";

// Guías aprobadas (/guias), en vivo; game filtra por juego. Las de autores
// con bloqueo de por medio no se muestran, como en el feed.
export const useApprovedGuides = (user, game) => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const { blockedIds } = useBlockedIds(user);

  useEffect(() => {
    setLoading(true);
    setError(false);

    return guideService.subscribeToApprovedGuides(
      { game },
      (data) => {
        setGuides(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error obteniendo guías:", err);
        setGuides([]);
        setError(true);
        setLoading(false);
      }
    );
  }, [game, retryKey]);

  const visibleGuides = useMemo(
    () => excludeBlockedAuthors(guides, blockedIds, "authorId"),
    [guides, blockedIds]
  );

  const retry = () => setRetryKey((key) => key + 1);

  return { guides: visibleGuides, loading, error, retry };
};
