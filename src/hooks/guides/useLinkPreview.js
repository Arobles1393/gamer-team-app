import { useCallback, useRef, useState } from "react";
import { guideService } from "../../services/guides";

const EMPTY = { title: null, description: null, image: null };

// Vista previa de un link antes de compartirlo (Cloud Function). status:
// "idle" | "loading" | "ready" | "failed". Una vista previa fallida no
// impide compartir el link.
export const useLinkPreview = () => {
  const [state, setState] = useState({ url: null, status: "idle", preview: null });
  // Si se piden dos seguidas, solo cuenta la última
  const requestRef = useRef(0);

  const load = useCallback(async (url) => {
    const requestId = ++requestRef.current;
    setState({ url, status: "loading", preview: null });

    try {
      const preview = await guideService.fetchLinkPreview(url);
      if (requestId !== requestRef.current) return;

      const hasData = Boolean(preview?.title || preview?.description || preview?.image);
      setState({ url, status: hasData ? "ready" : "failed", preview: hasData ? preview : EMPTY });
    } catch (error) {
      if (requestId !== requestRef.current) return;

      console.error("Error generando la vista previa:", error);
      setState({ url, status: "failed", preview: EMPTY });
    }
  }, []);

  const reset = useCallback(() => {
    requestRef.current++;
    setState({ url: null, status: "idle", preview: null });
  }, []);

  return { ...state, load, reset };
};
