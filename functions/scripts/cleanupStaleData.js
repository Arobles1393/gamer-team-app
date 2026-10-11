// Limpieza de datos viejos u huérfanos a mano, igual que la función
// programada cleanupStaleData (sirve mientras el proyecto no tiene Blaze).
//
// Uso (desde la raíz):
//   npm run data:cleanup              -> solo muestra qué borraría
//   npm run data:cleanup -- --write   -> borra en producción
//
// Credenciales: GOOGLE_APPLICATION_CREDENTIALS apuntando a las de
// `firebase login` o a una cuenta de servicio del proyecto.

const admin = require("firebase-admin");

const WRITE = process.argv.includes("--write");

admin.initializeApp({projectId: "gamerteam-4ed20", storageBucket: "gamerteam-4ed20.firebasestorage.app"});

const {runCleanup} = require("../cleanup/cleanup.service");

runCleanup({write: WRITE})
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      if (!WRITE) console.log("Modo prueba: no se borró nada. Usa --write para borrar.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("No se pudo limpiar:", error.message);
      process.exit(1);
    });
