// Borra TODO lo de las cuentas qa_* (las de qa-users.json): cuentas de Auth,
// users, publicProfiles, matchProfiles, guías, posts (con su grupo, mensajes, comentarios,
// interesados y el -1 de game_stats), chats, amistades, solicitudes,
// bloqueos y notificaciones. Lo de otros usuarios no se toca, salvo
// notificaciones o comentarios que las cuentas qa_ hayan dejado.
//
//   npm run qa:cleanup              -> solo muestra qué borraría
//   npm run qa:cleanup -- --write   -> borra
const fs = require("fs");
const r = require("module").createRequire(require("path").join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");
const { FieldValue } = r("firebase-admin/firestore");

admin.initializeApp({ projectId: "gamerteam-4ed20" });
const db = admin.firestore();
const write = process.argv.includes("--write");
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
const uids = Object.values(QA).filter((u) => u && u.uid && u.username?.startsWith("qa_")).map((u) => u.uid);

const byField = async (collection, field, op = "in") => {
  const snaps = await Promise.all(uids.map((uid) =>
    db.collection(collection).where(field, op === "in" ? "==" : "array-contains", uid).get()));
  return snaps.flatMap((s) => s.docs);
};

(async () => {
  const refs = new Map();
  const add = (docs) => docs.forEach((d) => refs.set(d.ref.path, d.ref));
  const statDecrements = {};

  const posts = await byField("posts", "userId");
  for (const post of posts) {
    add([post]);
    const game = post.data().game;
    if (game) statDecrements[game] = (statDecrements[game] || 0) + 1;
    const [group, messages, comments, interests] = await Promise.all([
      db.doc(`group_chats/${post.id}`).get(),
      db.collection(`group_chats/${post.id}/messages`).get(),
      db.collection("post_comments").where("postId", "==", post.id).get(),
      db.collection("post_interested").where("postId", "==", post.id).get()
    ]);
    if (group.exists) add([group]);
    add(messages.docs); add(comments.docs); add(interests.docs);
  }

  const chats = await byField("chats", "participants", "contains");
  for (const chat of chats) {
    add([chat]);
    add((await db.collection(`chats/${chat.id}/messages`).get()).docs);
  }

  add(await byField("post_comments", "userId"));
  add(await byField("post_interested", "userId"));
  add(await byField("friends", "users", "contains"));
  add(await byField("friend_requests", "senderId"));
  add(await byField("friend_requests", "receiverId"));
  add(await byField("blocks", "participants", "contains"));
  add(await byField("notifications", "userId"));
  add(await byField("notifications", "senderId"));
  add(await byField("reports", "reporterId"));
  add(await byField("guides", "authorId"));
  // Activos temporales del mapa de la comunidad (community.e2e), por si una
  // corrida se cortó antes de borrarlos
  add((await db.collection("users")
    .where(admin.firestore.FieldPath.documentId(), ">=", "qa_map_")
    .where(admin.firestore.FieldPath.documentId(), "<", "qa_map_")
    .get()).docs);
  uids.forEach((uid) => {
    refs.set(`users/${uid}`, db.doc(`users/${uid}`));
    refs.set(`publicProfiles/${uid}`, db.doc(`publicProfiles/${uid}`));
    refs.set(`matchProfiles/${uid}`, db.doc(`matchProfiles/${uid}`));
  });

  const counts = {};
  [...refs.keys()].forEach((path) => {
    const parts = path.split("/");
    const key = parts.length > 2 ? `${parts[0]}/*/${parts[2]}` : parts[0];
    counts[key] = (counts[key] || 0) + 1;
  });
  console.log(`Cuentas qa_: ${uids.length}`);
  console.log("Documentos por colección:", counts);
  console.log("game_stats a descontar:", statDecrements);

  if (!write) {
    console.log("\nSolo simulación. Agrega --write para borrar.");
    return;
  }

  const all = [...refs.values()];
  for (let i = 0; i < all.length; i += 400) {
    const batch = db.batch();
    all.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
  for (const [game, n] of Object.entries(statDecrements)) {
    await db.doc(`game_stats/${encodeURIComponent(game)}`).update({ postCount: FieldValue.increment(-n) });
  }
  for (const uid of uids) {
    await admin.auth().deleteUser(uid).catch((e) => console.error(`Auth ${uid}:`, e.message));
  }
  console.log(`\n${all.length} documentos y ${uids.length} cuentas borrados.`);
  // Las cuentas ya no existen: sus credenciales tampoco sirven
  fs.unlinkSync(`${__dirname}/.qa-users.json`);
})().catch((e) => { console.error("Error:", e.message); process.exit(1); });
