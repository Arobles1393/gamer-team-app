const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const Parser = require("rss-parser");
admin.initializeApp();
const db = admin.firestore();
const parser = new Parser();
require("dotenv").config();
const { getSteamStats } = require("./steam/steam.functions");
const { getGameLogo, getGamePortada } = require("./steamgrid/steamgrid.functions");

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
exports.getGameLogo = getGameLogo;
exports.getGamePortada = getGamePortada;