import { useEffect } from "react";

const isHidden = () => typeof document !== "undefined" && document.visibilityState === "hidden";

// Llama a `callback` al montar y luego cada `delayMs`, pero solo con la
// pestaña visible: al ocultarla se pausa, y al volver se llama de inmediato
// si ya pasó el intervalo (auditoría B-27: sin invocaciones de Functions ni
// llamadas a Steam/Twitch con la pestaña en segundo plano).
// `callback` debe ser estable (useCallback): cuando cambia, el ciclo empieza
// de nuevo con una llamada inmediata. `enabled` false no llama nunca.
export const useVisibleInterval = (callback, delayMs, enabled = true) => {
  useEffect(() => {
    if (!enabled) return undefined;

    let interval = null;
    let lastRun = 0;

    const run = () => {
      lastRun = Date.now();
      callback();
    };

    const start = () => {
      if (interval) return;
      if (Date.now() - lastRun >= delayMs) run();
      interval = setInterval(run, delayMs);
    };

    const stop = () => {
      clearInterval(interval);
      interval = null;
    };

    const onVisibilityChange = () => (isHidden() ? stop() : start());

    // Abierta en una pestaña oculta: espera a que se vea
    if (!isHidden()) start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [callback, delayMs, enabled]);
};
