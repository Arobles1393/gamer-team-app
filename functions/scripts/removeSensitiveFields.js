// Quita phone y email de todos los documentos users/{uid}. El correo vive
// solo en Firebase Auth y el teléfono ya no se pide. Idempotente: los
// documentos que ya no los tienen no se tocan. Lotes de 400 escrituras.
// Después de correrlo con --apply se puede activar la regla de users que
// rechaza esos campos (si no, guardar un perfil viejo fallaría).
//
// Uso (desde functions/):
//   node scripts/removeSensitiveFields.js            -> solo cuenta (dry run)
//   node scripts/removeSensitiveFields.js --apply    -> escribe
//
// Destino:
// - Producción: GOOGLE_APPLICATION_CREDENTIALS apuntando a las credenciales
//   de `firebase login` o a una cuenta de servicio del proyecto.
// - Emulador: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 (el Admin SDK lo usa
//   solo). PROJECT_ID cambia el proyecto (por defecto gamerteam-4ed20).

const admin = require("firebase-admin");
const {FieldValue} = require("firebase-admin/firestore");

const PROJECT_ID = process.env.PROJECT_ID || "gamerteam-4ed20";
const SENSITIVE_FIELDS = ["phone", "email"];
const BATCH_SIZE = 400;
const apply = process.argv.includes("--apply");

admin.initializeApp({projectId: PROJECT_ID});
const db = admin.firestore();

const main = async () => {
  const target = process.env.FIRESTORE_EMULATOR_HOST ?
    `emulador ${process.env.FIRESTORE_EMULATOR_HOST}` :
    `producción (${PROJECT_ID})`;
  console.log(`Destino: ${target}. Modo: ${apply ? "--apply (escribe)" : "dry run (solo cuenta)"}`);

  const users = await db.collection("users").get();
  const pending = users.docs.filter((userDoc) =>
    SENSITIVE_FIELDS.some((field) => field in userDoc.data()));

  const counts = Object.fromEntries(SENSITIVE_FIELDS.map((field) =>
    [field, pending.filter((userDoc) => field in userDoc.data()).length]));
  console.log(`users: ${users.size} documentos, ${pending.length} con datos a quitar`, counts);

  if (!apply || pending.length === 0) {
    if (!apply) console.log("\nSolo conteo. Agrega --apply para escribir.");
    return;
  }

  const removal = Object.fromEntries(SENSITIVE_FIELDS.map((field) => [field, FieldValue.delete()]));
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = db.batch();
    pending.slice(i, i + BATCH_SIZE).forEach((userDoc) => batch.update(userDoc.ref, removal));
    await batch.commit();
    console.log(`  lote ${i / BATCH_SIZE + 1}: ${Math.min(BATCH_SIZE, pending.length - i)} documentos`);
  }
  console.log(`\nListo: ${pending.length} documentos sin ${SENSITIVE_FIELDS.join(" ni ")}.`);
};

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
