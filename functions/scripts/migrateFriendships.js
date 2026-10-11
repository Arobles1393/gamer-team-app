// Pasa friend_requests y friends a ids deterministas (los que exigen las
// reglas desde que la amistad requiere consentimiento):
// - friend_requests/{senderId}_{receiverId}
// - friends/{uidMenor}_{uidMayor}, con users ordenado
// Copia cada documento viejo (id aleatorio) a su id nuevo y borra el viejo.
// Si hay varios para el mismo id, gana el más relevante (pendiente sobre
// aceptada sobre rechazada) y, a igualdad, el más reciente.
//
// Uso (desde functions/):
//   node scripts/migrateFriendships.js           -> solo muestra qué haría
//   node scripts/migrateFriendships.js --write   -> escribe en Firestore
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS con las de `firebase login`
// o una cuenta de servicio del proyecto.
const admin = require("firebase-admin");

const PROJECT_ID = "gamerteam-4ed20";
const write = process.argv.includes("--write");

admin.initializeApp({projectId: PROJECT_ID});
const db = admin.firestore();

const STATUS_PRIORITY = {pending: 3, accepted: 2, rejected: 1};

const millis = (value) => value?.toMillis?.() ?? 0;

// El documento que se queda cuando varios van al mismo id
const pickWinner = (docs, rank) =>
  [...docs].sort((a, b) =>
    rank(b) - rank(a) || millis(b.data().createdAt) - millis(a.data().createdAt),
  )[0];

const groupBy = (docs, keyOf) =>
  docs.reduce((groups, doc) => {
    const key = keyOf(doc);
    (groups[key] ??= []).push(doc);
    return groups;
  }, {});

const main = async () => {
  const [requests, friends] = await Promise.all([
    db.collection("friend_requests").get(),
    db.collection("friends").get(),
  ]);

  const operations = [];

  const requestGroups = groupBy(requests.docs, (doc) => {
    const {senderId, receiverId} = doc.data();
    return `${senderId}_${receiverId}`;
  });

  for (const [id, docs] of Object.entries(requestGroups)) {
    if (docs.length === 1 && docs[0].id === id) continue;

    const winner = pickWinner(docs, (doc) => STATUS_PRIORITY[doc.data().status] ?? 0);
    console.log(`- friend_requests ${id.slice(0, 12)}… <- ${docs.length} doc(s), queda "${winner.data().status}"`);

    operations.push((batch) => batch.set(db.collection("friend_requests").doc(id), winner.data()));
    docs.filter((doc) => doc.id !== id)
        .forEach((doc) => operations.push((batch) => batch.delete(doc.ref)));
  }

  const friendGroups = groupBy(friends.docs, (doc) => [...doc.data().users].sort().join("_"));

  for (const [id, docs] of Object.entries(friendGroups)) {
    if (docs.length === 1 && docs[0].id === id) continue;

    // La amistad más antigua conserva su fecha
    const winner = pickWinner(docs, (doc) => -millis(doc.data().createdAt));
    console.log(`- friends ${id.slice(0, 12)}… <- ${docs.length} doc(s)`);

    operations.push((batch) =>
      batch.set(db.collection("friends").doc(id), {
        ...winner.data(),
        users: [...winner.data().users].sort(),
      }),
    );
    docs.filter((doc) => doc.id !== id)
        .forEach((doc) => operations.push((batch) => batch.delete(doc.ref)));
  }

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
