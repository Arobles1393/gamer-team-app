import { useEffect, useMemo, useState } from "react";
import { matchService } from "../../services/matching";
import { hasMatchPreferences } from "../../constants";
import { useMatchProfile } from "./useMatchProfile";
import { useFriends } from "../friends/useFriends";
import { useBlockedIds } from "../blocks/useBlockedIds";

// "Compatibles contigo": jugadores ordenados por % de compatibilidad, sin
// amigos ni bloqueados (en cualquier dirección).
// needsSetup: no configuré mis preferencias -> la interfaz invita a hacerlo
// needsGames: tengo preferencias pero ningún juego favorito (sin juegos no
// hay cómo acotar la búsqueda, ver matchService)
export const useCompatibleMatches = (user, { enabled = true } = {}) => {
  const { profile, loading: loadingProfile, error: profileError } = useMatchProfile(user);
  const { friendIds, loading: loadingFriends, error: friendsError, retry: retryFriends } = useFriends(user);
  const { blockedIds, loading: loadingBlocks, error: blocksError } = useBlockedIds(user);
  // Sin la lista de amigos o de bloqueos no se sugiere a nadie: podría
  // colarse alguien que no debe aparecer
  const excludeError = friendsError || blocksError;

  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const needsSetup = Boolean(profile) && !hasMatchPreferences(profile.preferences);
  const needsGames = Boolean(profile) && !needsSetup && profile.gameIds.length === 0;
  const ready = enabled && Boolean(profile) && !needsSetup && !needsGames && !loadingFriends && !loadingBlocks && !excludeError;

  // Clave estable: solo se vuelve a buscar si cambia algo que importa
  const excludeKey = useMemo(
    () => [...friendIds, ...blockedIds].sort().join(","),
    [friendIds, blockedIds]
  );
  const profileKey = profile ? JSON.stringify([profile.preferences, profile.gameIds, profile.region]) : "";

  useEffect(() => {
    if (!ready) {
      setMatches([]);
      return undefined;
    }

    let cancelled = false;
    setLoadingMatches(true);
    setError(false);

    matchService
      .findCompatibleCandidates(user.uid, profile, excludeKey ? excludeKey.split(",") : [])
      .then((result) => {
        if (!cancelled) setMatches(result);
      })
      .catch((err) => {
        console.error("Error buscando jugadores compatibles:", err);
        if (!cancelled) {
          setMatches([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMatches(false);
      });

    return () => {
      cancelled = true;
    };
    // profile entra por profileKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, excludeKey, profileKey, retryKey]);

  return {
    matches,
    myProfile: profile,
    loading: enabled && (loadingProfile || loadingFriends || loadingBlocks || loadingMatches),
    needsSetup,
    needsGames,
    error: error || profileError || excludeError,
    retry: () => {
      if (friendsError) retryFriends();
      setRetryKey((key) => key + 1);
    }
  };
};
