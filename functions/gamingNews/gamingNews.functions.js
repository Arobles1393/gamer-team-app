const { onRequest } = require("firebase-functions/v2/https");
const { syncGamingNewsService } = require("./gamingNews.service");

const syncGamingNews = onRequest(
  async (req, res) => {

    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        error: "Método no permitido"
      });
    }

    try {

      const result = await syncGamingNewsService();

      return res.json({
        success: true,
        ...result
      });

    } catch (error) {

      console.error(
        "Error sincronizando noticias:",
        error
      );

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = {
  syncGamingNews
};