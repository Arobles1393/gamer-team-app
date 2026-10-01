import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 50;

// Mensajes en vivo de un chat (1:1 o de grupo), de a 50: se escuchan los
// últimos y "Ver mensajes anteriores" amplía la ventana. Sin esto, cada
// conversación traía su historial completo.
// subscribe(id, limitCount, onSuccess, onError) -> unsubscribe
export const useLiveMessages = (subscribe, id, errorLabel) => {
  // La ventana va atada al chat: al cambiar de chat vuelve a 50
  const [windowState, setWindowState] = useState({ id, limitCount: PAGE_SIZE });
  const limitCount = windowState.id === id ? windowState.limitCount : PAGE_SIZE;

  // loadedLimit: con qué ventana llegó la última respuesta
  const [state, setState] = useState({ id: null, messages: [], loadedLimit: 0, error: false });
  // Reintentar = volver a suscribirse
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!id) return;

    return subscribe(
      id,
      limitCount,
      (messages) => setState({ id, messages, loadedLimit: limitCount, error: false }),
      (error) => {
        console.error(errorLabel, error);
        setState({ id, messages: [], loadedLimit: limitCount, error: true });
      }
    );
  }, [subscribe, id, limitCount, errorLabel, retryKey]);

  // Mientras llega el chat nuevo no se muestran los mensajes del anterior
  const current = state.id === id;
  const messages = current ? state.messages : [];

  const loadOlder = useCallback(() => {
    setWindowState({ id, limitCount: limitCount + PAGE_SIZE });
  }, [id, limitCount]);

  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, id: null }));
    setRetryKey((key) => key + 1);
  }, []);

  return {
    messages,
    loading: !current,
    error: current && state.error,
    retry,
    // Si llegó la ventana completa, puede haber más atrás
    hasOlder: current && messages.length >= state.loadedLimit,
    loadingOlder: current && limitCount > state.loadedLimit,
    loadOlder
  };
};
