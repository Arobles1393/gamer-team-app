// Copia username, avatar y region de users/{uid} a publicProfiles/{uid}
// para los usuarios creados antes de que existiera publicProfiles.
//
// Uso (desde functions/):
//   node scripts/backfillPublicProfiles.js           -> solo muestra qué haría
//   node scripts/backfillPublicProfiles.js --write   -> escribe en Firestore
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS apuntando a las credenciales
// de `firebase login` o a una cuenta de servicio del proyecto.

const admin = require("firebase-admin");

const PROJECT_ID = "gamerteam-4ed20";
const PUBLIC_FIELDS = ["username", "avatar", "region"];
const write = process.argv.includes("--write");

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

const main = async () => {
  const users = await db.collection("users").get();
  const batch = db.batch();
  let count = 0;

  users.forEach((userDoc) => {
    const data = userDoc.data();

    if (typeof data.username !== "string") {
      console.log(`- ${userDoc.id}: sin username, se omite`);
      return;
    }

    const publicData = Object.fromEntries(
      PUBLIC_FIELDS.map((field) => [field, data[field] ?? null])
    );

    console.log(`- ${userDoc.id}: ${publicData.username}`);
    batch.set(db.collection("publicProfiles").doc(userDoc.id), publicData);
    count++;
  });

  if (!write) {
    console.log(`\n${count} perfiles por copiar. Agrega --write para escribirlos.`);
    return;
  }

  await batch.commit();
  console.log(`\n${count} perfiles públicos escritos.`);
};

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
