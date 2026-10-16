import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Cuánto se reintenta restaurar la posición o llegar al ancla mientras la
// página termina de cargar su contenido
const RETRY_MS = 1500;

// Posición de la ventana por entrada del historial (location.key), solo en
// memoria: al recargar la página se empieza arriba
const positions = new Map();

// Reintenta `step` en cada fotograma hasta que devuelva true o pase
// RETRY_MS. Si quien usa la página hace scroll o toca algo, se deja de
// insistir para no pelear con él. Devuelve la función para cancelar.
const retryEachFrame = (step) => {
  const start = performance.now();
  let frame = null;

  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    ["wheel", "touchstart", "keydown", "mousedown"].forEach((type) =>
      window.removeEventListener(type, stop)
    );
  };
  ["wheel", "touchstart", "keydown", "mousedown"].forEach((type) =>
    window.addEventListener(type, stop, { passive: true })
  );

  const tick = () => {
    frame = null;
    if (step() || performance.now() - start > RETRY_MS) {
      stop();
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  tick();

  return stop;
};

// Scroll al cambiar de página (BrowserRouter no lo hace solo): la ventana es
// la que hace scroll en todos los layouts (login y recuperar tienen su panel
// propio, que se monta de nuevo y ya empieza arriba).
// - PUSH/REPLACE a otra ruta: arriba, sin animación.
// - Mismo pathname (filtros o pestañas en la URL): no se mueve.
// - Con #ancla: baja al elemento con ese id cuando aparece.
// - POP (atrás/adelante): vuelve a donde estaba esa entrada, o arriba.
// No toca el scroll interno del chat ni el foco.
export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const lastY = useRef(0);
  const current = useRef({ key, pathname });

  // La restauración nativa pelearía con la de aquí
  useEffect(() => {
    const { history } = window;
    if (!("scrollRestoration" in history)) return undefined;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  // Última posición conocida, como mucho una lectura por fotograma
  useEffect(() => {
    let frame = null;
    const onScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        lastY.current = window.scrollY;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  // Antes de pintar la página nueva: así no se ve un salto
  useLayoutEffect(() => {
    const previous = current.current;
    const firstLoad = previous.key === key;
    // Al abrir la app solo importa el ancla (un enlace compartido a una
    // sección): el contenido llega después y el navegador no la encuentra
    if (firstLoad && !hash) return undefined;
    if (!firstLoad) {
      // La posición de la página que se deja, para volver con "atrás"
      positions.set(previous.key, lastY.current);
      current.current = { key, pathname };
    }

    if (!firstLoad && navigationType === "POP" && positions.has(key)) {
      const y = positions.get(key);
      return retryEachFrame(() => {
        const { scrollHeight } = document.documentElement;
        window.scrollTo({ top: y, left: 0, behavior: "auto" });
        // Listo cuando ya hay contenido suficiente y se llegó
        return scrollHeight - window.innerHeight >= y && Math.abs(window.scrollY - y) < 2;
      });
    }

    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      return retryEachFrame(() => {
        const target = document.getElementById(id);
        if (!target) return false;
        target.scrollIntoView({ behavior: "auto", block: "start" });
        return true;
      });
    }

    if (previous.pathname !== pathname || navigationType === "POP") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    return undefined;
  }, [key, pathname, hash, navigationType]);

  return null;
}
