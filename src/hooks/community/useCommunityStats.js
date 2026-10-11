import { useCallback, useEffect, useRef, useState } from "react";
import { useVisibleInterval } from "../polling/useVisibleInterval";
import { communityService } from "../../services/community";

// La función cachea 60 s: refrescar más seguido no trae nada nuevo
const REFRESH_MS = 60 * 1000;

// Actividad de la comunidad por país, para el mapa. Pide al montar, cada
// minuto con la pestaña visible (pausa al ocultarla, auditoría B-27) y de
// inmediato al cambiar de juego. Si llega la respuesta de un
// juego anterior (cambios rápidos), se descarta.
export const useCommunityStats = (gameId = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    const requestId = ++requestRef.current;
    if (!silent) setLoading(true);

    try {
      const stats = await communityService.getCommunityStats(gameId);
      if (requestId !== requestRef.current) return;
      setData(stats);
      setError(false);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      console.error("Error obteniendo la actividad de la comunidad:", err);
      // En un refresco silencioso se conservan los datos que ya se veían
      if (!silent) setData(null);
      setError(true);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [gameId]);

  // La primera carga de cada juego muestra el estado de carga; los
  // refrescos (cada minuto o al volver a la pestaña) son silenciosos
  const loadedRef = useRef(null);
  const poll = useCallback(() => {
    const silent = loadedRef.current === load;
    loadedRef.current = load;
    load({ silent });
  }, [load]);

  useVisibleInterval(poll, REFRESH_MS);

  // La respuesta pendiente ya no corresponde a este juego
  useEffect(() => () => { requestRef.current += 1; }, [load]);

  const refetch = useCallback(() => load(), [load]);

  return { data, loading, error, refetch };
};
