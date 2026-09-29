import { useEffect, useState } from "react";
import { userService } from "../services/users";

// Búsqueda de jugadores por prefijo de username, con debounce.
// Excluye al usuario actual de los resultados.
export const usePlayerSearch = (search, currentUserId) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const term = search.trim();

    if (!term) {
      setPlayers([]);
      setLoading(false);
      setError(false);
      return;
    }

    // Loading desde que se escribe, no solo tras el debounce
    setLoading(true);
    setError(false);

    let cancelled = false;

    const timeout = setTimeout(async () => {
      try {
        const data = await userService.searchUsers(term);

        if (!cancelled) {
          setPlayers(data.filter((player) => player.id !== currentUserId));
        }
      } catch (error) {
        console.error("Error buscando jugadores:", error);

        if (!cancelled) {
          setPlayers([]);
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search, currentUserId, retryKey]);

  const retry = () => setRetryKey((key) => key + 1);

  return { players, loading, error, retry };
};
