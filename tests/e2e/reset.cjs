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
  // Los sembrados son qa01..qa60 (setup.cjs). No basta con "empieza con qa":
  // un ID automático de Firestore también puede empezar así por azar
  msgs.forEach((d) => { if (!/^qa\d{2}$/.test(d.id)) batch.delete(d.ref); });
  const extraNotifs = await db.collection("notifications").where("userId", "==", bruno).where("relatedId", "==", chatId).get();
  extraNotifs.forEach((d) => batch.delete(d.ref));
  batch.update(db.doc(`chats/${chatId}`), { lastMessage: "Mensaje QA 60", lastSenderId: bruno });
  if (QA.eva) batch.delete(db.doc(`blocks/${QA.diego.uid}_${QA.eva.uid}`));
  // Partida de ana: solo el interés de bruno, como en setup.cjs (quita el de
  // carla de la prueba del grupo y cualquiera que haya quedado de otra prueba)
  const interests = await db.collection("post_interested").where("postId", "==", "qa_post_ana").get();
  interests.forEach((d) => { if (d.data().userId !== bruno) batch.delete(d.ref); });
  batch.update(db.doc("posts/qa_post_ana"), { interestedCount: 1 });
  batch.update(db.doc("group_chats/qa_post_ana"), { participants: [ana, bruno] });
  // La partida programada de carla siempre a 3 días (si no, con el tiempo
  // queda en el pasado y deja de salir en "Próximamente")
  batch.update(db.doc("posts/qa_post_carla"), { scheduledAt: admin.firestore.Timestamp.fromMillis(Date.now() + 3 * 86400000) });
  // Chat del grupo de la partida de ana: sin mensajes ni sus notificaciones
  (await db.collection("group_chats/qa_post_ana/messages").get()).forEach((d) => batch.delete(d.ref));
  batch.update(db.doc("group_chats/qa_post_ana"), { lastMessage: "", lastMessageAt: null, lastSenderId: null });
  (await db.collection("notifications").where("relatedId", "==", "qa_post_ana").where("type", "==", "group_message").get())
    .forEach((d) => batch.delete(d.ref));
  // Reportes que hizo carla en pruebas anteriores
  (await db.collection("reports").where("reporterId", "==", carla).get()).forEach((d) => batch.delete(d.ref));
  // Guía de bienvenida ya vista en todas las cuentas qa_ (si no, se abre sola)
  for (const account of Object.values(QA).filter((u) => u && u.uid)) {
    batch.set(db.doc(`users/${account.uid}/private/preferences`), { onboarding: { completed: true, showAgain: false, completedVersion: 1 } }, { merge: true });
  }
  await batch.commit();
  console.log("escenario reiniciado");
})().catch((e) => { console.error(e.message); process.exit(1); });
