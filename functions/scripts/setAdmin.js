// Da o quita el permiso de admin (custom claim `admin`) a una cuenta.
// Las reglas lo leen como request.auth.token.admin y la app con useIsAdmin.
//
// Uso (desde functions/):
//   node scripts/setAdmin.js <email o uid>            -> da admin
//   node scripts/setAdmin.js <email o uid> --remove   -> lo quita
//
// El usuario tiene que cerrar sesión y volver a entrar (o esperar ~1 h)
// para que su token traiga el claim nuevo.
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS con las de `firebase login`
// o una cuenta de servicio del proyecto.

const admin = require("firebase-admin");

const PROJECT_ID = "gamerteam-4ed20";
const [target] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const remove = process.argv.includes("--remove");

if (!target) {
  console.error("Uso: node scripts/setAdmin.js <email o uid> [--remove]");
  process.exit(1);
}

admin.initializeApp({ projectId: PROJECT_ID });

const main = async () => {
  const user = target.includes("@")
    ? await admin.auth().getUserByEmail(target)
    : await admin.auth().getUser(target);

  const claims = { ...(user.customClaims || {}) };

  if (remove) {
    delete claims.admin;
  } else {
    claims.admin = true;
  }

  await admin.auth().setCustomUserClaims(user.uid, claims);

  console.log(`${remove ? "Admin quitado a" : "Admin asignado a"} ${user.email || user.uid} (${user.uid})`);
};

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
