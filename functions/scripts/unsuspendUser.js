// Reactiva una cuenta suspendida desde el panel de reportes (moderate,
// suspendUser) y lo anota en moderation_log.
//
// Uso (desde la raíz): npm run admin:unsuspend -- <email o uid>
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS con las de `firebase login`
// o una cuenta de servicio del proyecto.

const admin = require("firebase-admin");
const {FieldValue} = require("firebase-admin/firestore");

const PROJECT_ID = "gamerteam-4ed20";
const [target] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

if (!target) {
  console.error("Uso: npm run admin:unsuspend -- <email o uid>");
  process.exit(1);
}

admin.initializeApp({projectId: PROJECT_ID});

const main = async () => {
  const user = target.includes("@") ?
    await admin.auth().getUserByEmail(target) :
    await admin.auth().getUser(target);

  if (!user.disabled) {
    console.log(`${user.email || user.uid} no está suspendida: no se cambia nada`);
    return;
  }

  await admin.auth().updateUser(user.uid, {disabled: false});
  await admin.firestore().collection("moderation_log").add({
    adminId: null,
    action: "unsuspendUser",
    targetType: "user",
    targetId: user.uid,
    authorId: user.uid,
    reportId: null,
    done: true,
    source: "script",
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`Cuenta reactivada: ${user.email || user.uid} (${user.uid})`);
};

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
