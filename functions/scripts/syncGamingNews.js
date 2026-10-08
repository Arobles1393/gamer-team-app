// Actualiza las noticias (gaming_news) a mano, igual que la función
// programada syncGamingNews. Sirve mientras el proyecto no tiene plan Blaze
// (las funciones programadas no corren en el emulador).
//
// Uso (desde la raíz): npm run news:sync
//   o (desde functions/): node scripts/syncGamingNews.js
//
// Escribe en Firestore de producción. Credenciales:
// GOOGLE_APPLICATION_CREDENTIALS apuntando a las de `firebase login` o a una
// cuenta de servicio del proyecto.

const admin = require("firebase-admin");

admin.initializeApp({projectId: "gamerteam-4ed20"});

// Después de inicializar: el servicio usa admin.firestore() al cargarse
const {syncGamingNewsService} = require("../gamingNews/gamingNews.service");

syncGamingNewsService()
  .then((result) => {
    console.log("Noticias actualizadas:", JSON.stringify(result));
    process.exit(0);
  })
  .catch((error) => {
    console.error("No se pudieron actualizar las noticias:", error.message);
    process.exit(1);
  });
