// deleteAccount: borra la vista previa del último mensaje en chats de partida
// ajenos (clearLastMessagePreviews), contra el emulador de Firestore. Solo
// este paso: deleteAccount completo usa Auth y Storage reales.
// Uso: npm run test:functions:emulator
const path = require("path");
const r = require("module").createRequire(path.join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");
const { clearLastMessagePreviews } = require(path.join(__dirname, "../../functions/account/account.service.js"));

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

const GONE = "uidGone";
const OTHER = "uidOther";
const AT = admin.firestore.Timestamp.fromMillis(1_800_000_000_000);
const group = (id, lastSenderId, lastMessage) =>
  db.doc(`group_chats/${id}`).set({ postId: id, participants: [GONE, OTHER], active: true, lastMessage, lastMessageAt: AT, lastSenderId, createdAt: AT });

(async () => {
  await Promise.all([
    group("g1", GONE, "nos vemos a las 9"),
    group("g2", GONE, "📷 Foto"),
    group("g3", OTHER, "dale")
  ]);

  console.log("\n=== vista previa del último mensaje");
  const count = await clearLastMessagePreviews(GONE, db);
  check("limpia los 2 chats donde su mensaje era el último", count === 2, String(count));

  const [g1, g2, g3] = await Promise.all(["g1", "g2", "g3"].map((id) => db.doc(`group_chats/${id}`).get()));
  check("sin su texto ni su autoría", g1.get("lastMessage") === "" && g1.get("lastSenderId") === null && g2.get("lastMessage") === "");
  check("conserva lastMessageAt (orden y limpieza diaria)", g1.get("lastMessageAt").isEqual(AT));
  check("no toca el resto del chat", g1.get("active") === true && g1.get("participants").length === 2);
  check("no toca chats cuyo último mensaje es de otra persona", g3.get("lastMessage") === "dale" && g3.get("lastSenderId") === OTHER);
  check("idempotente: una segunda vez no encuentra nada", (await clearLastMessagePreviews(GONE, db)) === 0);

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} pruebas OK${failed ? ` (${failed} fallaron)` : ""}`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
