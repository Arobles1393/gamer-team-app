import { useEffect, useState } from "react";
import { matchService } from "../../services/matching";

// Mi matchProfile (preferencias de juego), en vivo.
// profile: { exists, preferences, gameIds, region }; null mientras carga
export const useMatchProfile = (user) => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setProfile(null);
    setError(false);
    if (!user) return undefined;

    return matchService.subscribeToMatchProfile(
      user.uid,
      setProfile,
      (err) => {
        console.error("Error obteniendo preferencias de juego:", err);
        setError(true);
      }
    );
  }, [user]);

  return { profile, loading: Boolean(user) && !profile && !error, error };
};
