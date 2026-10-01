// Borra lo que quedó colgando de posts ya borrados (antes de que
// postService.deletePost limpiara al borrar):
// - post_comments y post_interested cuyo post no existe
// - notificaciones de comentarios, interesados y mensajes de grupo de esos posts
// Los comentarios con media también borran su archivo de Storage, si existe.
//
// Uso (desde functions/):
//   node scripts/cleanupOrphans.js           -> solo muestra qué haría
//   node scripts/cleanupOrphans.js --write   -> borra en Firestore (y Storage)
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS con las de `firebase login`
// o una cuenta de servicio del proyecto.
const admin = require("firebase-admin");

const PROJECT_ID = "gamerteam-4ed20";
const write = process.argv.includes("--write");

// Notificaciones cuyo relatedId es un postId
const POST_NOTIFICATION_TYPES = ["comment", "interested", "group_message"];

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

const main = async () => {
  const [posts, comments, interests, notifications] = await Promise.all(
    ["posts", "post_comments", "post_interested", "notifications"].map((name) => db.collection(name).get())
  );

  const postIds = new Set(posts.docs.map((doc) => doc.id));
  const orphanComments = comments.docs.filter((doc) => !postIds.has(doc.data().postId));
  const orphanInterests = interests.docs.filter((doc) => !postIds.has(doc.data().postId));
  const orphanNotifications = notifications.docs.filter((doc) =>
    POST_NOTIFICATION_TYPES.includes(doc.data().type) && !postIds.has(doc.data().relatedId)
  );
  const mediaPaths = orphanComments.map((doc) => doc.data().mediaPath).filter(Boolean);

  console.log(`post_comments huérfanos: ${orphanComments.length} (con archivo: ${mediaPaths.length})`);
  console.log(`post_interested huérfanos: ${orphanInterests.length}`);
  console.log(`notificaciones de posts borrados: ${orphanNotifications.length}`);

  const refs = [...orphanComments, ...orphanInterests, ...orphanNotifications].map((doc) => doc.ref);

  if (!write) {
    console.log(`\n${refs.length} documentos por borrar. Agrega --write para borrarlos.`);
    return;
  }

  // Lotes de 400 (límite de Firestore: 500 por batch)
  for (let i = 0; i < refs.length; i += 400) {
    const batch = db.batch();
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  for (const path of mediaPaths) {
    try {
      await admin.storage().bucket().file(path).delete();
    } catch (error) {
      console.error(`No se pudo borrar ${path}:`, error.message);
    }
  }

  console.log(`\n${refs.length} documentos borrados.`);
};

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
