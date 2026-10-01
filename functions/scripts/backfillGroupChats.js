// Crea group_chats/{postId} para los posts que todavía no lo tienen:
// participantes = autor + quienes marcaron "Me interesa" (post_interested).
// No toca los grupos que ya existen.
//
// Uso (desde functions/):
//   node scripts/backfillGroupChats.js           -> solo muestra qué haría
//   node scripts/backfillGroupChats.js --write   -> escribe en Firestore
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS con las de `firebase login`
// o una cuenta de servicio del proyecto.

const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

const PROJECT_ID = "gamerteam-4ed20";
const write = process.argv.includes("--write");

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

const main = async () => {
  const [posts, interested, groups] = await Promise.all([
    db.collection("posts").get(),
    db.collection("post_interested").get(),
    db.collection("group_chats").get()
  ]);

  const existing = new Set(groups.docs.map((doc) => doc.id));

  const interestedByPost = {};
  interested.forEach((doc) => {
    const { postId, userId } = doc.data();
    (interestedByPost[postId] ??= new Set()).add(userId);
  });

  const batch = db.batch();
  let count = 0;

  posts.forEach((doc) => {
    if (existing.has(doc.id)) return;

    const post = doc.data();
    const participants = [
      post.userId,
      ...[...(interestedByPost[doc.id] || [])].filter((uid) => uid !== post.userId)
    ];

    console.log(`- ${doc.id.slice(0, 6)}… ${post.game}: ${participants.length} participante(s)`);

    batch.set(db.collection("group_chats").doc(doc.id), {
      postId: doc.id,
      participants,
      active: true,
      lastMessage: "",
      lastMessageAt: null,
      lastSenderId: null,
      createdAt: post.createdAt || FieldValue.serverTimestamp()
    });
    count++;
  });

  if (!write) {
    console.log(`\n${count} chats de grupo por crear. Agrega --write para escribirlos.`);
    return;
  }

  if (count) await batch.commit();
  console.log(`\n${count} chats de grupo creados.`);
};

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
