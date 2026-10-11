// Ruta del archivo de un comentario: solo se borra si está en la carpeta de
// quien lo escribió (comments/{userId}/{archivo}), la misma comprobación que
// firestore.rules. Segunda capa por si algún comentario antiguo trae una
// ruta ajena: borrar con permisos de admin el avatar de otro o un adjunto de
// un chat sería irreversible.
const isOwnCommentMediaPath = (mediaPath, userId) => {
  if (typeof mediaPath !== "string" || typeof userId !== "string" || !userId) {
    return false;
  }

  const prefix = `comments/${userId}/`;
  const fileName = mediaPath.slice(prefix.length);

  return mediaPath.length <= 300 &&
    mediaPath.startsWith(prefix) &&
    fileName.length > 0 &&
    !fileName.includes("/");
};

module.exports = {isOwnCommentMediaPath};
