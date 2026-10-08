// Rellena los datos del feed por categorías para los posts existentes:
// - posts.interestedCount: cuántos docs de post_interested tiene cada post
// - posts.authorRegion: el campo `region` que guardaban los posts viejos
//   (región al publicar) o, si no lo tienen, la región actual del autor
// - game_stats/{encodeURIComponent(game)}.postCount: posts por juego
//   (no toca searchCount)
//
// Uso (desde functions/):
//   node scripts/backfillFeedCategories.js           -> solo muestra qué haría
//   node scripts/backfillFeedCategories.js --write   -> escribe en Firestore
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS apuntando a las credenciales
// de `firebase login` o a una cuenta de servicio del proyecto.

const admin = require("firebase-admin");
const {FieldValue} = require("firebase-admin/firestore");

const PROJECT_ID = "gamerteam-4ed20";
const write = process.argv.includes("--write");

admin.initializeApp({projectId: PROJECT_ID});
const db = admin.firestore();

const main = async () => {
  const [posts, interested, profiles] = await Promise.all([
    db.collection("posts").get(),
    db.collection("post_interested").get(),
    db.collection("publicProfiles").get(),
  ]);

  const interestedByPost = {};
  interested.forEach((doc) => {
    const {postId} = doc.data();
    interestedByPost[postId] = (interestedByPost[postId] || 0) + 1;
  });

  const regionByUser = {};
  profiles.forEach((doc) => {
    regionByUser[doc.id] = doc.data().region || null;
  });

  const postsByGame = {};
  const batch = db.batch();

  posts.forEach((doc) => {
    const post = doc.data();
    const interestedCount = interestedByPost[doc.id] || 0;
    const authorRegion =
      post.authorRegion ?? post.region ?? regionByUser[post.userId] ?? null;

    postsByGame[post.game] = (postsByGame[post.game] || 0) + 1;

    console.log(
        `- post ${doc.id.slice(0, 6)}… ${post.game}: ` +
      `interestedCount=${interestedCount}, authorRegion=${authorRegion}`,
    );

    batch.update(doc.ref, {interestedCount, authorRegion});
  });

  for (const [game, postCount] of Object.entries(postsByGame)) {
    console.log(`- game_stats ${game}: postCount=${postCount}`);

    batch.set(
        db.collection("game_stats").doc(encodeURIComponent(game)),
        {game, postCount, updatedAt: FieldValue.serverTimestamp()},
        {merge: true},
    );
  }

  if (!write) {
    console.log(
        `\n${posts.size} posts y ${Object.keys(postsByGame).length} juegos ` +
      "por actualizar. Agrega --write para escribirlos.",
    );
    return;
  }

  await batch.commit();
  console.log(`\n${posts.size} posts y ${Object.keys(postsByGame).length} juegos actualizados.`);
};

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
