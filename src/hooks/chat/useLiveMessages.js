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
  const [state, setState] = useState({ id: null, messages: [], loadedLimit: 0 });

  useEffect(() => {
    if (!id) return;

    return subscribe(
      id,
      limitCount,
      (messages) => setState({ id, messages, loadedLimit: limitCount }),
      (error) => {
        console.error(errorLabel, error);
        setState({ id, messages: [], loadedLimit: limitCount });
      }
    );
  }, [subscribe, id, limitCount, errorLabel]);

  // Mientras llega el chat nuevo no se muestran los mensajes del anterior
  const current = state.id === id;
  const messages = current ? state.messages : [];

  const loadOlder = useCallback(() => {
    setWindowState({ id, limitCount: limitCount + PAGE_SIZE });
  }, [id, limitCount]);

  return {
    messages,
    loading: !current,
    // Si llegó la ventana completa, puede haber más atrás
    hasOlder: current && messages.length >= state.loadedLimit,
    loadingOlder: current && limitCount > state.loadedLimit,
    loadOlder
  };
};
