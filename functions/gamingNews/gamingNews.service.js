const admin = require("firebase-admin");
const Parser = require("rss-parser");
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

const syncGamingNewsService = async () => {

  const news = [];

  for (const feed of feeds) {

    const rss = await parser.parseURL(feed.url);

    for (const item of rss.items) {

      if (!item.link) {
        continue;
      }

      const id = Buffer
        .from(item.link)
        .toString("base64")
        .replace(/\//g, "_");

      const image = getNewsImage(item);

      news.push({
        id,
        data: {
          title: item.title || "",
          description:
            item.contentSnippet ||
            item["content:encodedSnippet"] ||
            "",
          link: item.link,
          image,
          source: feed.source,
          publishedAt: item.pubDate
            ? new Date(item.pubDate)
            : new Date(),
          createdAt: new Date()
        }
      });
    }
  }

  // Si no encontramos noticias, no borramos las actuales
  if (news.length === 0) {
    return {
      inserted: 0,
      deleted: 0
    };
  }

  // Borrar noticias anteriores
  const existingSnapshot =
    await db
      .collection("gaming_news")
      .get();

  const deleteBatch =
    db.batch();

  existingSnapshot.forEach((doc) => {
    deleteBatch.delete(doc.ref);
  });

  await deleteBatch.commit();

  // Insertar noticias nuevas
  const insertBatch = db.batch();

  news.forEach((item) => {

    const docRef =
      db
        .collection("gaming_news")
        .doc(item.id);

    insertBatch.set(
      docRef,
      item.data
    );
  });

  await insertBatch.commit();

  return {
    inserted: news.length,
    deleted: existingSnapshot.size
  };
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