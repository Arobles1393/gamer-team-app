// Pone al día las reservas de nombres usernames/{usernameLower} (auditoría
// M-08: nombres únicos) con lo que dicen los perfiles:
// - reserva el nombre de los perfiles que no la tienen (creados antes de M-08);
// - quita el uid de las reservas del formato anterior: la reserva solo dice
//   que el nombre está ocupado, no de quién (se lee sin sesión);
// - lista (y con --write borra) las reservas de nombres que ningún perfil usa.
// Si dos perfiles tuvieran el mismo nombre, no toca ese nombre y los lista
// para resolverlos a mano.
//
// Uso (desde la raíz):
//   node functions/scripts/backfillUsernames.js           -> solo muestra qué haría
//   node functions/scripts/backfillUsernames.js --write   -> escribe en Firestore
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS apuntando a las de
// `firebase login` o a una cuenta de servicio del proyecto.

const admin = require("firebase-admin");

const PROJECT_ID = "gamerteam-4ed20";
const WRITE = process.argv.includes("--write");
const BATCH_SIZE = 400;

admin.initializeApp({projectId: PROJECT_ID});
const db = admin.firestore();
const {FieldValue} = admin.firestore;

const commitInBatches = async (ops) => {
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = db.batch();
    ops.slice(i, i + BATCH_SIZE).forEach((op) => op(batch));
    await batch.commit();
  }
};

(async () => {
  const [users, reserved] = await Promise.all([
    db.collection("users").get(),
    db.collection("usernames").get(),
  ]);

  // Nombre -> perfiles que lo usan
  const owners = new Map();
  users.docs.forEach((d) => {
    const lower = d.get("usernameLower");
    if (typeof lower !== "string" || !lower) return;
    owners.set(lower, [...(owners.get(lower) ?? []), d.id]);
  });
  const reservations = new Map(reserved.docs.map((d) => [d.id, d]));

  const conflicts = [...owners].filter(([, uids]) => uids.length > 1);
  const toCreate = [...owners.keys()].filter((lower) => owners.get(lower).length === 1 && !reservations.has(lower));
  const toStrip = reserved.docs.filter((d) => d.get("uid") !== undefined && owners.has(d.id));
  const orphans = reserved.docs.filter((d) => !owners.has(d.id));

  console.log(`Perfiles con nombre: ${owners.size}. Reservas: ${reserved.size}.`);
  console.log(`Por reservar: ${toCreate.length}. Con uid (formato anterior): ${toStrip.length}. Sin perfil que las use: ${orphans.length}.`);
  if (orphans.length) console.log(`Reservas sin perfil: ${orphans.map((d) => d.id).join(", ")}`);
  if (conflicts.length) {
    console.log(`Nombres repetidos (resolver a mano):\n  ${conflicts.map(([lower, uids]) => `${lower} (${uids.join(", ")})`).join("\n  ")}`);
  }
  if (!WRITE) {
    console.log("Modo prueba: no se escribió nada. Usa --write para aplicarlo.");
    process.exit(0);
  }

  await commitInBatches([
    ...toCreate.map((lower) => (batch) => batch.create(db.doc(`usernames/${lower}`), {createdAt: FieldValue.serverTimestamp()})),
    ...toStrip.map((d) => (batch) => batch.update(d.ref, {uid: FieldValue.delete()})),
    ...orphans.map((d) => (batch) => batch.delete(d.ref)),
  ]);
  console.log(`Reservadas: ${toCreate.length}. Sin uid: ${toStrip.length}. Borradas: ${orphans.length}.`);
  process.exit(0);
})().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
