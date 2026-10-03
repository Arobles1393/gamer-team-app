import { useEffect, useState } from "react";
import { guideService } from "../../services/guides";

// Guías del usuario en cualquier estado (Mi perfil)
export const useMyGuides = (user) => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      setGuides([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    return guideService.subscribeToMyGuides(
      user.uid,
      (data) => {
        setGuides(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo mis guías:", error);
        setGuides([]);
        setLoading(false);
      }
    );
  }, [user]);

  return { guides, loading };
};
