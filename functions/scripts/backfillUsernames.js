// Reserva en usernames/{usernameLower} el nombre de cada perfil existente
// (auditoría M-08: nombres únicos). Los perfiles nuevos ya lo reservan solos;
// esto es para los creados antes. Si dos perfiles tuvieran el mismo nombre,
// solo reserva el del más antiguo y lista los demás para resolverlos a mano.
//
// Uso (desde functions/):
//   node scripts/backfillUsernames.js           -> solo muestra qué haría
//   node scripts/backfillUsernames.js --write   -> escribe en Firestore
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS apuntando a las de
// `firebase login` o a una cuenta de servicio del proyecto.

const admin = require("firebase-admin");

const PROJECT_ID = "gamerteam-4ed20";
const WRITE = process.argv.includes("--write");

admin.initializeApp({projectId: PROJECT_ID});
const db = admin.firestore();

(async () => {
  const [users, reserved] = await Promise.all([
    db.collection("users").get(),
    db.collection("usernames").get(),
  ]);
  const taken = new Map(reserved.docs.map((d) => [d.id, d.data().uid]));

  // Más antiguos primero: si hubiera un nombre repetido, se lo queda el primero
  const profiles = users.docs
      .map((d) => ({uid: d.id, ...d.data()}))
      .filter((u) => typeof u.usernameLower === "string" && u.usernameLower)
      .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));

  const toCreate = [];
  const conflicts = [];
  for (const profile of profiles) {
    const owner = taken.get(profile.usernameLower);
    if (owner === profile.uid) continue;
    if (owner) {
      conflicts.push(`${profile.usernameLower} (${profile.uid} y ${owner})`);
      continue;
    }
    taken.set(profile.usernameLower, profile.uid);
    toCreate.push(profile);
  }

  console.log(`Perfiles: ${profiles.length}. Ya reservados: ${reserved.size}. Por reservar: ${toCreate.length}.`);
  if (conflicts.length) console.log(`Nombres repetidos (resolver a mano):\n  ${conflicts.join("\n  ")}`);
  if (!WRITE) {
    console.log("Modo prueba: no se escribió nada. Usa --write para reservar.");
    process.exit(0);
  }

  const batch = db.batch();
  toCreate.forEach((p) => batch.create(db.doc(`usernames/${p.usernameLower}`), {
    uid: p.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }));
  await batch.commit();
  console.log(`Reservados: ${toCreate.length}.`);
  process.exit(0);
})().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
