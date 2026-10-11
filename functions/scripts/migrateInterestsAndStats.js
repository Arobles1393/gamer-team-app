// Prepara los datos para las reglas que atan los contadores a su acción:
// - post_interested pasa a id determinista `${postId}_${userId}` (copia el
//   documento viejo de id aleatorio al id nuevo y borra el viejo)
// - game_stats.postCount se recalcula contando los posts reales de cada juego
//
// Uso (desde functions/):
//   node scripts/migrateInterestsAndStats.js           -> solo muestra qué haría
//   node scripts/migrateInterestsAndStats.js --write   -> escribe en Firestore
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS con las de `firebase login`
// o una cuenta de servicio del proyecto.
const admin = require("firebase-admin");

const PROJECT_ID = "gamerteam-4ed20";
const write = process.argv.includes("--write");

admin.initializeApp({projectId: PROJECT_ID});
const db = admin.firestore();

const main = async () => {
  const [interests, posts, stats] = await Promise.all([
    db.collection("post_interested").get(),
    db.collection("posts").get(),
    db.collection("game_stats").get(),
  ]);

  const operations = [];

  // ---------- post_interested ----------
  const existingIds = new Set(interests.docs.map((doc) => doc.id));

  interests.forEach((doc) => {
    const {postId, userId} = doc.data();
    const id = `${postId}_${userId}`;

    if (doc.id === id) return;

    // Si ya hay uno con el id nuevo, el viejo es un duplicado: solo se borra
    if (!existingIds.has(id)) {
      operations.push((batch) => batch.set(db.collection("post_interested").doc(id), doc.data()));
      existingIds.add(id);
    }

    operations.push((batch) => batch.delete(doc.ref));
    console.log(`- post_interested ${doc.id.slice(0, 8)}… -> ${id.slice(0, 16)}…`);
  });

  // ---------- game_stats.postCount ----------
  const postsByGame = {};
  posts.forEach((doc) => {
    const {game} = doc.data();
    if (game) postsByGame[game] = (postsByGame[game] || 0) + 1;
  });

  stats.forEach((doc) => {
    const {game, postCount = 0} = doc.data();
    const real = postsByGame[game] || 0;

    if (postCount === real) return;

    operations.push((batch) => batch.update(doc.ref, {postCount: real}));
    console.log(`- game_stats "${game}": postCount ${postCount} -> ${real}`);
  });

  if (!write) {
    console.log(`\n${operations.length} operaciones pendientes. Agrega --write para aplicarlas.`);
    return;
  }

  // Lotes de 400 (límite de Firestore: 500 por batch)
  for (let i = 0; i < operations.length; i += 400) {
    const batch = db.batch();
    operations.slice(i, i + 400).forEach((operation) => operation(batch));
    await batch.commit();
  }

  console.log(`\n${operations.length} operaciones aplicadas.`);
};

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
