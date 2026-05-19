const functions = require("firebase-functions");
const axios = require("axios");
require("dotenv").config();

exports.getSteamStats = functions.https.onCall(async (request) => {
  try {

    let { steamId, appid } = request.data;

    console.log("Este es el request ", request.data)

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
    
    // Obtener logros
    if (appid) {
      const achievementsRes = await axios.get(
        "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/",
        {
          params: {
            key: key,
            steamid: steamIdFinal,
            appid
          }
        }
      );
    
      const achievements = achievementsRes.data.playerstats?.achievements || [];

      const schemaRes = await axios.get(
        "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/",
        {
          params: {
            key: key,
            appid
          }
        }
      );

      const schemaAchievements = schemaRes.data.game?.availableGameStats?.achievements || [];

      const globalRes = await axios.get(
        "https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/",
        {
          params: {
            gameid: appid
          }
        }
      );

      const globalAchievements = globalRes.data.achievementpercentages.achievements;

      const mergedAchievements = achievements.map((ach) => {
        const schema = schemaAchievements.find(
          (s) => s.name === ach.apiname
        );

        const global = globalAchievements.find(
          (g) => g.name === ach.apiname
        );

        return {
          name: schema?.displayName || ach.apiname,
          description: schema?.description || "",
          icon: schema?.icon || "",
          iconGray: schema?.icongray || "",
          achieved: ach.achieved,
          percent: global?.percent ? parseFloat(global.percent) : 0
        };
      });
    
      return {
        achievements: mergedAchievements
      };
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
    games.sort((a, b) => b.playtime_forever - a.playtime_forever);

    const totalGames = games.length;
    const totalHours = games.reduce((acc, game) => acc + (game.playtime_forever || 0), 0) / 60;

    return {
      totalGames,
      totalHours: Math.round(totalHours),
      games: games.slice(0, 12)
    };

  } catch (error) {
    console.error("❌ Error Steam:", error);

    throw new functions.https.HttpsError(
      "internal",
      error.message || "Error obteniendo datos de Steam"
    );
  }
});

exports.getGameLogo = functions.https.onCall(async (request) => {

  try {

    const { gameName } = request.data;

    if (!gameName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Nombre del juego requerido"
      );
    }

    const apiKey = process.env.STEAMGRID_API_KEY;

    if (!apiKey) {
      throw new functions.https.HttpsError(
        "internal",
        "API key no configurada"
      );
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
      `https://www.steamgriddb.com/api/v2/logos/game/${game.id}`,
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