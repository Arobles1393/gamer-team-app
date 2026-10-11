// moderate contra el emulador de Firestore: borrar una partida (con lo
// ligado) y un comentario, cierre de reportes y registro. Las acciones sobre
// cuentas usan Auth real y se prueban en el e2e (moderation.e2e.cjs).
// Uso: npm run test:functions:emulator
const path = require("path");
const r = require("module").createRequire(path.join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");
const { moderate } = require(path.join(__dirname, "../../functions/moderation/moderation.service.js"));

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("Falta FIRESTORE_EMULATOR_HOST: corre con npm run test:functions:emulator");
  process.exit(1);
}

admin.initializeApp({ projectId: "demo-gamermatch" });
const db = admin.firestore();

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const ADMIN = "uidAdmin";
const AUTHOR = "uidAuthor";
const FAN = "uidFan";
const AT = new Date();
const STATS = `game_stats/${encodeURIComponent("Hades")}`;
const exists = async (p) => (await db.doc(p).get()).exists;
const report = (id, targetType, targetId, status = "pending") =>
  db.doc(`reports/${id}`).set({ reporterId: FAN, targetType, targetId, reason: "spam", note: "", status, createdAt: AT, reviewedAt: null });

(async () => {
  await Promise.all([
    db.doc("posts/p1").set({ userId: AUTHOR, game: "Hades", interestedCount: 1, createdAt: AT }),
    db.doc("post_comments/c1").set({ postId: "p1", userId: FAN, text: "voy", createdAt: AT }),
    db.doc("post_interested/p1_uidFan").set({ postId: "p1", userId: FAN, createdAt: AT }),
    db.doc("group_chats/p1").set({ postId: "p1", participants: [AUTHOR, FAN], active: true, lastMessage: "", lastMessageAt: null, lastSenderId: null, createdAt: AT }),
    db.doc("group_chats/p1/messages/m1").set({ senderId: FAN, text: "hola", createdAt: AT }),
    db.doc("notifications/n1").set({ userId: AUTHOR, senderId: FAN, type: "interested", relatedId: "p1", read: false, createdAt: AT }),
    db.doc(STATS).set({ game: "Hades", postCount: 3, updatedAt: AT }),
    db.doc("posts/p2").set({ userId: FAN, game: "Hades", createdAt: AT }),
    db.doc("post_comments/c2").set({ postId: "p2", userId: AUTHOR, text: "insulto", createdAt: AT }),
    db.doc("post_comments/c3").set({ postId: "p2", userId: FAN, text: "otro", createdAt: AT }),
    report("r1", "post", "p1"),
    report("r2", "post", "p1"),
    report("r3", "post", "p1", "reviewed"),
    report("r4", "comment", "c2"),
    report("r5", "post", "p2")
  ]);

  console.log("\n=== borrar una partida reportada");
  const res = await moderate(ADMIN, { action: "deletePost", targetId: "p1", reportId: "r1" });
  check("responde hecho y 2 reportes cerrados", res.done === true && res.closedReports === 2, JSON.stringify(res));
  check("borra la partida, comentarios, interesados y avisos", !(await exists("posts/p1")) && !(await exists("post_comments/c1"))
    && !(await exists("post_interested/p1_uidFan")) && !(await exists("notifications/n1")));
  check("borra el chat del grupo con sus mensajes", !(await exists("group_chats/p1")) && !(await exists("group_chats/p1/messages/m1")));
  check("descuenta 1 en game_stats", (await db.doc(STATS).get()).get("postCount") === 2);
  const r1 = (await db.doc("reports/r1").get()).data();
  check("los reportes pendientes quedan revisados con la acción", r1.status === "reviewed" && r1.resolution === "deletePost" && Boolean(r1.reviewedAt)
    && (await db.doc("reports/r2").get()).get("status") === "reviewed");
  check("no toca un reporte ya revisado ni los de otra cosa", !(await db.doc("reports/r3").get()).get("resolution")
    && (await db.doc("reports/r5").get()).get("status") === "pending");
  const logs = (await db.collection("moderation_log").where("targetId", "==", "p1").get()).docs.map((d) => d.data());
  check("registro: admin, acción, autor y reporte", logs.length === 1 && logs[0].adminId === ADMIN && logs[0].action === "deletePost"
    && logs[0].authorId === AUTHOR && logs[0].reportId === "r1" && logs[0].done === true, JSON.stringify(logs[0]));

  console.log("\n=== borrar un comentario reportado");
  const c = await moderate(ADMIN, { action: "deleteComment", targetId: "c2", reportId: "r4" });
  check("borra solo ese comentario", c.done === true && !(await exists("post_comments/c2")) && await exists("post_comments/c3") && await exists("posts/p2"));
  check("cierra su reporte", (await db.doc("reports/r4").get()).get("resolution") === "deleteComment");

  console.log("\n=== lo reportado ya no existe");
  const gone = await moderate(ADMIN, { action: "deletePost", targetId: "p1" });
  check("no falla: done false y queda registrado", gone.done === false
    && (await db.collection("moderation_log").where("targetId", "==", "p1").get()).size === 2);

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} pruebas OK${failed ? ` (${failed} fallaron)` : ""}`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
