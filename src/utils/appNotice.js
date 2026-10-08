// Avisos que nacen fuera de un componente montado (p. ej. el registro: al
// crearse la cuenta /login redirige y el formulario desaparece antes de
// saber si se pudo mandar el correo de verificación). Si la app ya escucha,
// le llega al momento; si no, queda pendiente hasta que se suscriba.
// Con persist, sobrevive a recargar la página (sessionStorage): lo usa
// "Eliminar cuenta", que vuelve al inicio con una recarga completa.
const KEY = "gm-app-notice";
let listener = null;
let pending = [];
// El aviso guardado se lee una sola vez por carga de página: si la app se
// vuelve a suscribir antes de recargar (p. ej. al cambiar el idioma), no
// debe llevárselo la página que se está yendo
let persistedChecked = false;

// notice: { severity, summaryKey, detailKey, detailParams? } (claves de i18n
// y, opcional, sus parámetros: { hours: 5 })
export const postAppNotice = (notice, { persist = false } = {}) => {
  if (persist) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(notice));
    } catch {
      // Sin almacenamiento no hay aviso tras recargar
    }
    return;
  }
  if (listener) listener(notice);
  else pending.push(notice);
};

const takePersisted = () => {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return raw ? [JSON.parse(raw)] : [];
  } catch {
    return [];
  }
};

export const subscribeToAppNotices = (callback) => {
  listener = callback;
  const persisted = persistedChecked ? [] : takePersisted();
  persistedChecked = true;
  const queued = [...persisted, ...pending];
  pending = [];
  queued.forEach(callback);

  return () => {
    if (listener === callback) listener = null;
  };
};
