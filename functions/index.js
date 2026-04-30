const functions = require("firebase-functions");
const axios = require("axios");
require("dotenv").config();

exports.getSteamStats = functions.https.onCall(async (request) => {
  try {
    let { steamId } = request.data;

    if (!steamId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Steam ID requerido"
      );
    }

    const key = process.env.STEAM_API_KEY;

    if (!key) {
      throw new functions.https.HttpsError(
        "internal",
        "API Key no configurada"
      );
    }

    // 🔥 limpiar input (por si viene URL completa)
    steamId = steamId.replace(/\/$/, "");
    const parts = steamId.split("/");
    steamId = parts[parts.length - 1];

    let steamIdFinal = steamId;

    // 🧠 detectar si es vanity (no numérico)
    if (!/^\d+$/.test(steamId)) {
      const resolveRes = await axios.get(
        "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/",
        {
          params: {
            key: key,
            vanityurl: steamId
          }
        }
      );

      if (resolveRes.data.response.success !== 1) {
        throw new functions.https.HttpsError(
          "not-found",
          "No se pudo resolver el usuario de Steam"
        );
      }

      steamIdFinal = resolveRes.data.response.steamid;
    }

    // 🎮 obtener juegos
    const gamesRes = await axios.get(
      "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/",
      {
        params: {
          key: key,
          steamid: steamIdFinal,
          include_appinfo: true,
          include_played_free_games: true
        }
      }
    );

    const games = gamesRes.data.response.games || [];

    const totalGames = games.length;
    const totalHours =
      games.reduce((acc, game) => acc + (game.playtime_forever || 0), 0) / 60;

    return {
      totalGames,
      totalHours: Math.round(totalHours),
      games: games.slice(0, 6) // top 6 🔥
    };

  } catch (error) {
    console.error("❌ Error Steam:", error);

    throw new functions.https.HttpsError(
      "internal",
      error.message || "Error obteniendo datos de Steam"
    );
  }
});