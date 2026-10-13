import { useCallback, useEffect, useRef, useState } from "react";

// Cuánto dura el "¡Dentro!" antes de volver al botón normal
export const JOINED_MS = 1600;

/**
 * Fases del botón "Quiero jugar" (src/styles/motion.css):
 * "idle" | "saving" (esperando la respuesta) | "joined" (acaba de unirse:
 * destello, check y "¡Dentro!" durante JOINED_MS).
 * run(wasInterested, action): action devuelve true si se guardó. Solo unirse
 * (no salir) celebra; si falla o no se pudo (sin verificar, etc.) vuelve a idle.
 */
export const useJoinFeedback = () => {
  const [phase, setPhase] = useState("idle");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const run = useCallback(async (wasInterested, action) => {
    clearTimeout(timer.current);
    setPhase("saving");
    let ok = false;
    try {
      ok = Boolean(await action());
    } finally {
      if (ok && !wasInterested) {
        setPhase("joined");
        timer.current = setTimeout(() => setPhase("idle"), JOINED_MS);
      } else {
        setPhase("idle");
      }
    }
    return ok;
  }, []);

  return { phase, run };
};
