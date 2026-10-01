// Deja el escenario de QA como lo creó setup.cjs (npm run qa:reset): solicitud de Carla
// pendiente y el chat Ana-Bruno con solo sus 60 mensajes sembrados
const fs = require("fs");
const r = require("module").createRequire(require("path").join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");
admin.initializeApp({ projectId: "gamerteam-4ed20" });
const db = admin.firestore();
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
(async () => {
  const { ana, bruno, carla } = { ana: QA.ana.uid, bruno: QA.bruno.uid, carla: QA.carla.uid };
  const batch = db.batch();
  batch.set(db.doc(`friend_requests/${carla}_${ana}`), { senderId: carla, receiverId: ana, status: "pending", createdAt: admin.firestore.Timestamp.now() });
  batch.delete(db.doc(`friends/${[ana, carla].sort().join("_")}`));
  const notifs = await db.collection("notifications").where("userId", "==", ana).where("senderId", "==", carla).get();
  notifs.forEach((d) => batch.update(d.ref, { status: "pending", read: false }));
  const accepted = await db.collection("notifications").where("userId", "==", carla).where("senderId", "==", ana).where("type", "==", "friend_accepted").get();
  accepted.forEach((d) => batch.delete(d.ref));
  const chatId = [ana, bruno].sort().join("_");
  const msgs = await db.collection(`chats/${chatId}/messages`).get();
  msgs.forEach((d) => { if (!d.id.startsWith("qa")) batch.delete(d.ref); });
  const extraNotifs = await db.collection("notifications").where("userId", "==", bruno).where("relatedId", "==", chatId).get();
  extraNotifs.forEach((d) => batch.delete(d.ref));
  batch.update(db.doc(`chats/${chatId}`), { lastMessage: "Mensaje QA 60", lastSenderId: bruno });
  if (QA.eva) batch.delete(db.doc(`blocks/${QA.diego.uid}_${QA.eva.uid}`));
  // Interés de carla en la partida de ana (lo crea la prueba del grupo)
  const carlaInterest = await db.doc(`post_interested/qa_post_ana_${carla}`).get();
  if (carlaInterest.exists) {
    batch.delete(carlaInterest.ref);
    batch.update(db.doc("posts/qa_post_ana"), { interestedCount: admin.firestore.FieldValue.increment(-1) });
  }
  batch.update(db.doc("group_chats/qa_post_ana"), { participants: admin.firestore.FieldValue.arrayRemove(carla) });
  // Chat del grupo de la partida de ana: sin mensajes ni sus notificaciones
  (await db.collection("group_chats/qa_post_ana/messages").get()).forEach((d) => batch.delete(d.ref));
  batch.update(db.doc("group_chats/qa_post_ana"), { lastMessage: "", lastMessageAt: null, lastSenderId: null });
  (await db.collection("notifications").where("relatedId", "==", "qa_post_ana").where("type", "==", "group_message").get())
    .forEach((d) => batch.delete(d.ref));
  // Reportes que hizo carla en pruebas anteriores
  (await db.collection("reports").where("reporterId", "==", carla).get()).forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log("escenario reiniciado");
})().catch((e) => { console.error(e.message); process.exit(1); });
