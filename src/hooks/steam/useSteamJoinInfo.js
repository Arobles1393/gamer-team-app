import { useEffect, useRef, useState } from "react";
import { steamJoinService } from "../../services/steam";

const POLL_MS = 45 * 1000;
// Tras 3 respuestas seguidas sin sala, se consulta más espaciado
const SLOW_POLL_MS = 120 * 1000;
const SLOW_AFTER_MISSES = 3;
const NOT_AVAILABLE = { available: false };

/**
 * "Unirme en Steam" de una persona. Consulta al montar y luego cada 45 s
 * (120 s tras 3 respuestas seguidas sin sala), solo con la pestaña visible.
 * enabled: condición del cliente para no hacer llamadas inútiles (la
 * autorización real es la del servidor). Los errores no muestran avisos:
 * cuentan como "no disponible".
 */
export const useSteamJoinInfo = ({ targetUid, postId = null, enabled = true }) => {
  const [info, setInfo] = useState(NOT_AVAILABLE);
  const [loading, setLoading] = useState(false);
  // Descarta respuestas de otra persona/partida (cambios rápidos)
  const requestRef = useRef(0);
  const missesRef = useRef(0);

  useEffect(() => {
    setInfo(NOT_AVAILABLE);
    missesRef.current = 0;
    if (!enabled || !targetUid) return undefined;

    let timer = null;
    let stopped = false;

    const schedule = () => {
      clearTimeout(timer);
      if (stopped || document.visibilityState !== "visible") return;
      timer = setTimeout(load, missesRef.current >= SLOW_AFTER_MISSES ? SLOW_POLL_MS : POLL_MS);
    };

    async function load() {
      const requestId = ++requestRef.current;
      setLoading(true);
      let result = NOT_AVAILABLE;
      try {
        const data = await steamJoinService.getJoinInfo(targetUid, postId);
        result = data?.available === true ? data : NOT_AVAILABLE;
      } catch (error) {
        console.warn("Unirme en Steam: no se pudo consultar", error.code || error.message);
      }
      if (stopped || requestId !== requestRef.current) return;
      missesRef.current = result.available ? 0 : missesRef.current + 1;
      setInfo(result);
      setLoading(false);
      schedule();
    }

    // Pausa con la pestaña oculta; al volver, consulta de inmediato
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
      else clearTimeout(timer);
    };

    if (document.visibilityState === "visible") load();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      clearTimeout(timer);
      requestRef.current += 1;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [targetUid, postId, enabled]);

  return { info, loading };
};
