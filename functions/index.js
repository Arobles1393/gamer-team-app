const functions = require("firebase-functions");
const axios = require("axios");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const Parser = require("rss-parser");
admin.initializeApp();
const db = admin.firestore();
const parser = new Parser();
require("dotenv").config();

const {
  getSteamStats
} = require("./steam/steam.functions");

exports.getGameLogo = functions.https.onCall(async (request) => {

  try {

    let { steamAppId, gameName } = request.data;

    if (!gameName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "App ID de Steam y nombre del juego requeridos"
      );
    }

    const apiKey = process.env.STEAMGRID_API_KEY;

    if (!apiKey) {
      throw new functions.https.HttpsError(
        "internal",
        "API key no configurada"
      );
    }

    if (gameName.toLowerCase().includes("requiem")) {
      gameName = gameName
        .replace(/\d+/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    // Buscar juego
    const searchRes = await axios.get(
      `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    const game = searchRes.data.data[0];

    if (!game) {
      return {
        logo: null
      };
    }

    // Obtener logos
    const logosRes = await axios.get(
      !steamAppId ?
        `https://www.steamgriddb.com/api/v2/logos/game/${game.id}` :
        `https://www.steamgriddb.com/api/v2/logos/steam/${steamAppId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    const logos = logosRes.data.data;

    // Priorizar logos no NSFW y estilo limpio
    const cleanLogo = logos.find(
      (logo) =>
        !logo.nsfw &&
        logo.width > 500
    );

    return {
      logo: cleanLogo?.url || logos[0]?.url || null
    };

  } catch (error) {

    console.error("❌ SteamGrid Error:", error);

    throw new functions.https.HttpsError(
      "internal",
      error.message || "Error obteniendo logo"
    );
  }
});

exports.getGamePortada = functions.https.onCall(async (request) => {

  try {

    let { steamAppId, gameName } = request.data;

    if (!gameName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "App ID de Steam y nombre del juego requeridos"
      );
    }

    const apiKey = process.env.STEAMGRID_API_KEY;

    if (!apiKey) {
      throw new functions.https.HttpsError(
        "internal",
        "API key no configurada"
      );
    }

    if (gameName.toLowerCase().includes("requiem")) {
      gameName = gameName
        .replace(/\d+/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    // Buscar juego
    const searchRes = await axios.get(
      `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    const game = searchRes.data.data[0];

    if (!game) {
      return {
        portada: null
      };
    }

    // Obtener poratda
    const portadasRes = await axios.get(
      !steamAppId ?
        `https://www.steamgriddb.com/api/v2/grids/game/${game.id}` :
        `https://www.steamgriddb.com/api/v2/grids/steam/${steamAppId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    const portadas = portadasRes.data.data;

    return {
      portada: portadas[0]?.url || null
    };

  } catch (error) {

    console.error("❌ SteamGrid Error:", error);

    throw new functions.https.HttpsError(
      "internal",
      error.message || "Error obteniendo portada"
    );
  }
});

exports.syncGamingNews = onRequest(
  async (req, res) => {
    try {
      const feeds = [
        {
          source: "IGN",
          url: "https://feeds.ign.com/ign/all"
        },
        {
          source: "GameSpot",
          url: "https://www.gamespot.com/feeds/mashup/"
        }
      ];

      let inserted = 0;

      for (const feed of feeds) {

        const rss =
          await parser.parseURL(
            feed.url
          );

        for (const item of rss.items) {

          const id = Buffer
            .from(item.link)
            .toString("base64")
            .replace(/\//g, "_");

          const docRef =
            db.collection(
              "gaming_news"
            ).doc(id);

          const docSnap =
            await docRef.get();

          if (!docSnap.exists) {

            let image = "";

            if (item.enclosure?.url) {
              image = item.enclosure.url;
            }

            if (!image && item.thumbnail) {
              image = item.thumbnail;
            }

            if (!image && item["media:thumbnail"]?.$?.url) {
              image = item["media:thumbnail"].$?.url;
            }

            if (!image && item["content:encoded"]) {
              const match =
                item["content:encoded"].match(
                  /<img[^>]+src="([^"]+)"/i
                );

              if (match) {
                image = match[1];
              }
            }

            await docRef.set({
              title: item.title || "",
              description:
                item.contentSnippet ||
                item["content:encodedSnippet"] ||
                "",
              link: item.link || "",
              image,
              source: feed.source,
              publishedAt: item.pubDate
                ? new Date(item.pubDate)
                : new Date(),
              createdAt: new Date()
            });

            inserted++;
          }
        }
      }

      res.json({
        succes: true,
        inserted
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          error.message
      });

    }
  }
);

exports.getSteamStats = getSteamStats;