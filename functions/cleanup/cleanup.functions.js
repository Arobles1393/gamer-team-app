const {onSchedule} = require("firebase-functions/v2/scheduler");
const {runCleanup} = require("./cleanup.service");

// Limpieza diaria de avisos viejos u huérfanos, chats de partida cerrados,
// nonces de Steam vencidos e imágenes de guías sin usar (auditoría B-21 y
// B-31). Función programada (requiere Blaze). Mientras tanto, a mano:
// npm run data:cleanup (revisa) / npm run data:cleanup -- --write (borra).
const cleanupStaleData = onSchedule(
    {
      schedule: "every day 04:00",
      timeZone: "America/Mexico_City",
      timeoutSeconds: 300,
      memory: "256MiB",
      maxInstances: 1,
      retryCount: 1,
    },
    async () => {
      const result = await runCleanup({write: true});
      console.info("cleanupStaleData:", JSON.stringify(result));
    },
);

module.exports = {cleanupStaleData};
