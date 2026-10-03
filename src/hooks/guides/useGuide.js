import { useEffect, useState } from "react";
import { guideService } from "../../services/guides";

// Una guía en vivo (/guias/:id). guide null = no existe o no se puede ver
// (por ejemplo, la guía pendiente de otro usuario)
export const useGuide = (guideId) => {
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!guideId) return;

    setLoading(true);
    setError(false);

    return guideService.subscribeToGuide(
      guideId,
      (data) => {
        setGuide(data);
        setLoading(false);
      },
      (err) => {
        // Sin permiso = pendiente o rechazada de otro: para el usuario es "no existe"
        if (err.code !== "permission-denied") {
          console.error("Error obteniendo la guía:", err);
          setError(true);
        }
        setGuide(null);
        setLoading(false);
      }
    );
  }, [guideId]);

  return { guide, loading, error };
};
