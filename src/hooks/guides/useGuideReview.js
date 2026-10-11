import { useCallback, useEffect, useState } from "react";
import { guideService } from "../../services/guides";

// Panel de admin: guías por revisar y la acción de aprobar o rechazar
export const useGuideReview = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    return guideService.subscribeToPendingGuides(
      (data) => {
        setGuides(data);
        setLoading(false);
        setError(false);
      },
      (err) => {
        console.error("Error obteniendo guías pendientes:", err);
        setError(true);
        setLoading(false);
      }
    );
  }, []);

  // status: "approved" | "rejected"
  const review = useCallback(
    (guideId, status, reviewNote) => guideService.reviewGuide(guideId, status, reviewNote),
    []
  );

  return { guides, loading, error, review };
};
