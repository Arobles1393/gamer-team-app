const admin = require("firebase-admin");
const {
  planNotifications,
  planGroupChats,
  planNonces,
  planGuideImages,
} = require("./cleanupPlan");

// Limpieza diaria de datos viejos u huérfanos (auditoría B-21 y B-31). Lee
// colecciones completas (pocas lecturas con el volumen de la beta) y borra lo
// que dice cleanupPlan.js. write false: solo cuenta (el script manual lo usa
// por defecto para revisar antes de borrar).

const BATCH_SIZE = 400;
const db = () => admin.firestore();

const deleteDocs = async (collection, ids) => {
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = db().batch();
    ids.slice(i, i + BATCH_SIZE).forEach((id) => batch.delete(db().collection(collection).doc(id)));
    await batch.commit();
  }
};

// Bucket de Storage, o null si el proyecto todavía no lo tiene
const getBucket = async () => {
  try {
    const bucket = admin.storage().bucket();
    const [exists] = await bucket.exists();
    return exists ? bucket : null;
  } catch (error) {
    console.warn("cleanup: Storage no disponible, se omiten archivos:", error.code || error.message);
    return null;
  }
};

const summarize = (planned) =>
  planned.reduce((acc, {reason}) => ({...acc, [reason]: (acc[reason] || 0) + 1}), {});

const runCleanup = async ({write = false, now = Date.now()} = {}) => {
  const [posts, chats, notifications, groups, nonces, guides] = await Promise.all([
    db().collection("posts").select().get(),
    db().collection("chats").select().get(),
    db().collection("notifications").select("type", "relatedId", "read", "createdAt").get(),
    db().collection("group_chats").select("active", "lastMessageAt", "createdAt").get(),
    db().collection("steamNonces").select("expiresAt").get(),
    db().collection("guides").select("coverImage", "content").get(),
  ]);

  const postIds = new Set(posts.docs.map((d) => d.id));
  const chatIds = new Set(chats.docs.map((d) => d.id));
  const asList = (snap) => snap.docs.map((d) => ({id: d.id, ...d.data()}));

  const plan = {
    notifications: planNotifications(asList(notifications), {postIds, chatIds, now}),
    groupChats: planGroupChats(asList(groups), {postIds, now}),
    steamNonces: planNonces(asList(nonces), {now}),
    guideImages: [],
  };

  const bucket = await getBucket();
  if (bucket) {
    const [files] = await bucket.getFiles({prefix: "guides/"});
    const guidesText = guides.docs.map((d) => `${d.get("coverImage") || ""} ${d.get("content") || ""}`).join(" ");
    plan.guideImages = planGuideImages(
        files.map((f) => ({name: f.name, updated: Date.parse(f.metadata?.updated)})),
        {guidesText, now},
    );
  }

  if (write) {
    await deleteDocs("notifications", plan.notifications.map((n) => n.id));
    await deleteDocs("steamNonces", plan.steamNonces.map((n) => n.id));
    for (const {id} of plan.groupChats) {
      // El grupo con sus mensajes, y sus adjuntos en Storage
      await db().recursiveDelete(db().collection("group_chats").doc(id));
      if (bucket) {
        const [files] = await bucket.getFiles({prefix: `group_chats/${id}/`});
        await Promise.all(files.map((f) => f.delete({ignoreNotFound: true})));
      }
    }
    if (bucket) {
      await Promise.all(plan.guideImages.map(({id}) => bucket.file(id).delete({ignoreNotFound: true})));
    }
  }

  return {
    write,
    storage: Boolean(bucket),
    notifications: summarize(plan.notifications),
    groupChats: summarize(plan.groupChats),
    steamNonces: summarize(plan.steamNonces),
    guideImages: summarize(plan.guideImages),
  };
};

module.exports = {runCleanup};
