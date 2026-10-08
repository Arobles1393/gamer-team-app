const admin = require("firebase-admin");
const Parser = require("rss-parser");
const {summarize} = require("./newsSummary");
const {planNewsSync} = require("./newsPlan");
const db = admin.firestore();
const parser = new Parser();

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

// Trae los feeds y actualiza gaming_news en un solo batch (newsPlan.js): el
// feed nunca queda vacío a medias, y si una fuente falla se conservan sus
// noticias. Devuelve conteos (sin datos personales: son noticias públicas).
const syncGamingNewsService = async () => {
  const fresh = [];
  const okSources = [];
  const failedSources = [];

  for (const feed of feeds) {
    try {
      const rss = await parser.parseURL(feed.url);

      for (const item of rss.items) {
        if (!item.link) {
          continue;
        }

        const id = Buffer
          .from(item.link)
          .toString("base64")
          .replace(/\//g, "_");

        fresh.push({
          id,
          data: {
            title: item.title || "",
            // Solo un resumen: algunos feeds traen el artículo completo
            description: summarize(
              item.contentSnippet ||
              item["content:encodedSnippet"] ||
              ""
            ),
            link: item.link,
            image: getNewsImage(item),
            source: feed.source,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            createdAt: new Date()
          }
        });
      }

      okSources.push(feed.source);
    } catch (error) {
      failedSources.push(feed.source);
      console.error(`syncGamingNews: falló el feed ${feed.source}:`, error.message);
    }
  }

  // Ninguna fuente respondió: no se toca lo que hay
  if (okSources.length === 0) {
    return {inserted: 0, deleted: 0, failedSources};
  }

  const existing = (await db.collection("gaming_news").get()).docs
    .map((doc) => ({id: doc.id, source: doc.data().source}));

  const {toSet, toDelete} = planNewsSync(existing, fresh, okSources);

  const batch = db.batch();
  toSet.forEach((item) => batch.set(db.collection("gaming_news").doc(item.id), item.data));
  toDelete.forEach((id) => batch.delete(db.collection("gaming_news").doc(id)));
  await batch.commit();

  return {inserted: toSet.length, deleted: toDelete.length, failedSources};
};

const getNewsImage = (item) => {

  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  if (item.thumbnail) {
    return item.thumbnail;
  }

  if (item["media:thumbnail"]?.$?.url) {
    return item["media:thumbnail"].$?.url;
  }

  if (item["content:encoded"]) {

    const match =
      item["content:encoded"].match(
        /<img[^>]+src="([^"]+)"/i
      );

    if (match) {
      return match[1];
    }
  }

  return "";
};

module.exports = {
  syncGamingNewsService
};