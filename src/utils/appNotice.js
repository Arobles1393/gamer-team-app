// Avisos que nacen fuera de un componente montado (p. ej. el registro: al
// crearse la cuenta /login redirige y el formulario desaparece antes de
// saber si se pudo mandar el correo de verificación). Si la app ya escucha,
// le llega al momento; si no, queda pendiente hasta que se suscriba.
let listener = null;
let pending = [];

// notice: { severity, summaryKey, detailKey } (claves de i18n)
export const postAppNotice = (notice) => {
  if (listener) listener(notice);
  else pending.push(notice);
};

export const subscribeToAppNotices = (callback) => {
  listener = callback;
  const queued = pending;
  pending = [];
  queued.forEach(callback);

  return () => {
    if (listener === callback) listener = null;
  };
};
