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

  let inserted = 0;

  for (const feed of feeds) {

    const rss = await parser.parseURL(feed.url);

    for (const item of rss.items) {

      const id = Buffer
        .from(item.link)
        .toString("base64")
        .replace(/\//g, "_");

      const docRef =
        db
          .collection("gaming_news")
          .doc(id);

      const docSnap = await docRef.get();

      if (docSnap.exists) {
        continue;
      }

      const image = getNewsImage(item);

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

  return { inserted };
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