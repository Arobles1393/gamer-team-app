require("dotenv").config();
const admin = require("firebase-admin");
// En el emulador no hay servidor de metadatos: para firmar custom tokens
// (loginWithSteam) se indica la cuenta de servicio en .env.local
const localSigner =
  process.env.FUNCTIONS_EMULATOR === "true" &&
  process.env.LOCAL_SIGNER_SERVICE_ACCOUNT;
admin.initializeApp(
  localSigner ? { serviceAccountId: localSigner } : undefined
);
const { getSteamStats, getSteamPresence } = require("./steam/steam.functions");
const { getGameLogo, getGamePortada } = require("./steamgrid/steamgrid.functions");
const { syncGamingNews } = require("./gamingNews/gamingNews.functions");
const { cleanupCommentMedia } = require("./postComments/postComments.functions");
const { loginWithSteam } = require("./steamAuth/steamAuth.functions");
const { logGameSearch } = require("./games/games.functions");
const { getTwitchPresence } = require("./twitch/twitch.functions");
const { fetchLinkPreview } = require("./guides/guides.functions");
const { getCommunityStats } = require("./community/community.functions");
const { deleteAccount } = require("./account/account.functions");
const { getJoinInfo } = require("./steamJoin/steamJoin.functions");

exports.getSteamStats = getSteamStats;
exports.getSteamPresence = getSteamPresence;
exports.getGameLogo = getGameLogo;
exports.getGamePortada = getGamePortada;
exports.syncGamingNews = syncGamingNews;
exports.cleanupCommentMedia = cleanupCommentMedia;
exports.loginWithSteam = loginWithSteam;
exports.logGameSearch = logGameSearch;
exports.getTwitchPresence = getTwitchPresence;
exports.fetchLinkPreview = fetchLinkPreview;
exports.getCommunityStats = getCommunityStats;
exports.deleteAccount = deleteAccount;
// Requiere plan Blaze para desplegarse; mientras tanto corre en el emulador
exports.getJoinInfo = getJoinInfo;