const {onSchedule} = require("firebase-functions/v2/scheduler");
const {syncGamingNewsService} = require("./gamingNews.service");

// Noticias de videojuegos una vez al día. Función programada (Cloud
// Scheduler, requiere plan Blaze), sin URL pública: antes era un endpoint
// HTTP que cualquiera podía invocar en bucle (auditoría C-01).
// Para actualizarlas a mano: npm run news:sync (functions/scripts).
const syncGamingNews = onSchedule(
    {
      schedule: "every 24 hours",
      timeZone: "America/Mexico_City",
      timeoutSeconds: 120,
      memory: "256MiB",
      maxInstances: 1,
      retryCount: 1,
    },
    async () => {
      const result = await syncGamingNewsService();
      console.info("syncGamingNews:", JSON.stringify(result));
    },
);

module.exports = {
  syncGamingNews,
};
