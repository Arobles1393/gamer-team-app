// functions/postComments/postComments.functions.js
const {onDocumentDeleted} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const {isOwnCommentMediaPath} = require("./commentMedia");

exports.cleanupCommentMedia = onDocumentDeleted(
    "post_comments/{commentId}",
    async (event) => {
      const deletedData = event.data?.data();

      if (!deletedData?.mediaPath) {
        return;
      }

      // Solo archivos de la carpeta de quien comentó (auditoría C-02)
      if (!isOwnCommentMediaPath(deletedData.mediaPath, deletedData.userId)) {
        console.warn(
            "cleanupCommentMedia: ruta fuera de la carpeta del autor, no se borra",
            event.params.commentId,
        );
        return;
      }

      try {
        await admin.storage().bucket().file(deletedData.mediaPath).delete({ignoreNotFound: true});
      } catch (error) {
        console.error(
            "Error eliminando archivo de Storage del comentario:",
            error.code || error.message,
        );
      }
    },
);
