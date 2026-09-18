require("dotenv").config();
const admin = require("firebase-admin");
admin.initializeApp();
const { getSteamStats } = require("./steam/steam.functions");
const { getGameLogo, getGamePortada } = require("./steamgrid/steamgrid.functions");
const { syncGamingNews } = require("./gamingNews/gamingNews.functions");
const { cleanupCommentMedia } = require("./postComments/postComments.functions");

exports.getSteamStats = getSteamStats;
exports.getGameLogo = getGameLogo;
exports.getGamePortada = getGamePortada;
exports.syncGamingNews = syncGamingNews;
exports.cleanupCommentMedia = cleanupCommentMedia;