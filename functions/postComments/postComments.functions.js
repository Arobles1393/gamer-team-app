// functions/postComments/postComments.functions.js
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

exports.cleanupCommentMedia = onDocumentDeleted(
  "post_comments/{commentId}",
  async (event) => {
    const deletedData = event.data?.data();

    if (!deletedData?.mediaPath) {
      return;
    }

    try {
      await admin.storage().bucket().file(deletedData.mediaPath).delete();
    } catch (error) {
      console.error(
        "Error eliminando archivo de Storage del comentario:",
        error
      );
    }
  }
);