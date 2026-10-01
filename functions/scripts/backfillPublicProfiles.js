// Copia los campos públicos de users/{uid} a publicProfiles/{uid}: lo que
// pueden ver los demás. Correo, teléfono e idioma se quedan solo en users.
// Reescribe cada perfil público completo (sin merge), así no quedan campos
// que ya no son públicos. Sirve para usuarios creados antes de publicProfiles
// y cada vez que se amplía la lista de campos públicos.
//
// Uso (desde functions/):
//   node scripts/backfillPublicProfiles.js           -> solo muestra qué haría
//   node scripts/backfillPublicProfiles.js --write   -> escribe en Firestore
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS apuntando a las credenciales
// de `firebase login` o a una cuenta de servicio del proyecto.

const admin = require("firebase-admin");

const PROJECT_ID = "gamerteam-4ed20";
// Misma lista que src/services/profile/publicProfileService.js y firestore.rules
const PUBLIC_FIELDS = [
  "username",
  "usernameLower",
  "avatar",
  "banner",
  "region",
  "description",
  "games",
  "links",
  "lastSeen",
  "createdAt"
];
// Siempre presentes (null si el usuario no los tiene), como al crear el perfil
const DEFAULT_NULL_FIELDS = ["avatar", "region"];
const write = process.argv.includes("--write");

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

const main = async () => {
  const users = await db.collection("users").get();
  const writes = [];

  users.forEach((userDoc) => {
    const data = userDoc.data();

    if (typeof data.username !== "string") {
      console.log(`- ${userDoc.id}: sin username, se omite`);
      return;
    }

    const publicData = Object.fromEntries(
      PUBLIC_FIELDS
        .filter((field) => data[field] !== undefined || DEFAULT_NULL_FIELDS.includes(field))
        .map((field) => [field, data[field] ?? null])
    );

    console.log(`- ${userDoc.id.slice(0, 8)}…: ${Object.keys(publicData).join(", ")}`);
    writes.push([db.collection("publicProfiles").doc(userDoc.id), publicData]);
  });

  if (!write) {
    console.log(`\n${writes.length} perfiles por copiar. Agrega --write para escribirlos.`);
    return;
  }

  // Lotes de 400 (límite de Firestore: 500 por batch)
  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    writes.slice(i, i + 400).forEach(([ref, data]) => batch.set(ref, data));
    await batch.commit();
  }

  console.log(`\n${writes.length} perfiles públicos escritos.`);
};

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
