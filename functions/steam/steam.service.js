const axios = require("axios");

const steamApi = axios.create({
  baseURL: "https://api.steampowered.com",
  timeout: 8000
});

class ValidationError extends Error {}

const getSteamStats = async ({ steamId, appid }) => {

  if (!steamId) {
    throw new ValidationError("Steam ID requerido");
  }

  const key = process.env.STEAM_API_KEY;

  if (!key) {
    throw new Error("API Key no configurada");
  }

  // Limpiar input
  steamId = steamId.replace(/\/$/, "");

  const parts = steamId.split("/");
  steamId = parts[parts.length - 1];

  let steamIdFinal = steamId;

  // Resolver Vanity URL
  if (!/^\d+$/.test(steamId)) {

    const resolveRes = await steamApi.get(
      "/ISteamUser/ResolveVanityURL/v0001/",
      {
        params: {
          key,
          vanityurl: steamId
        }
      }
    );

    if (resolveRes.data.response.success !== 1) {
      throw new ValidationError(
        "No se pudo resolver el usuario de Steam"
      );
    }

    steamIdFinal =
      resolveRes.data.response.steamid;
  }

  // ==========================
  // ACHIEVEMENTS
  // ==========================

  if (appid) {

    const [achievementsRes, schemaRes, globalResult] = await Promise.all([
      steamApi.get(
        "/ISteamUserStats/GetPlayerAchievements/v0001/",
        {
          params: {
            key,
            steamid: steamIdFinal,
            appid
          }
        }
      ),
      steamApi.get(
        "/ISteamUserStats/GetSchemaForGame/v2/",
        {
          params: {
            key,
            appid
          }
        }
      ),
      steamApi.get(
        "/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/",
        {
          params: {
            gameid: appid
          }
        }
      ).catch((error) => {
        console.error(
          "⚠️ No se pudo obtener rareza global de logros:",
          error.message
        );
        return null;
      })
    ]);

    const achievements =
      achievementsRes.data.playerstats?.achievements || [];

    const schemaAchievements =
      schemaRes.data.game
        ?.availableGameStats
        ?.achievements || [];

    const globalAchievements =
      globalResult?.data?.achievementpercentages?.achievements || [];

    const mergedAchievements =
      achievements.map((achievement) => {

        const schema =
          schemaAchievements.find(
            (item) =>
              item.name === achievement.apiname
          );

        const global =
          globalAchievements.find(
            (item) =>
              item.name === achievement.apiname
          );

        return {
          name:
            schema?.displayName ||
            achievement.apiname,

          description:
            schema?.description || "",

          icon:
            schema?.icon || "",

          iconGray:
            schema?.icongray || "",

          achieved:
            achievement.achieved,

          percent:
            global?.percent
              ? parseFloat(global.percent)
              : 0
        };
      });

    return {
      achievements: mergedAchievements
    };
  }

  // ==========================
  // GAMES
  // ==========================

  const gamesRes = await steamApi.get(
    "/IPlayerService/GetOwnedGames/v0001/",
    {
      params: {
        key,
        steamid: steamIdFinal,
        include_appinfo: true,
        include_played_free_games: true
      }
    }
  );

  const games =
    gamesRes.data.response.games || [];

  games.sort(
    (a, b) =>
      b.playtime_forever -
      a.playtime_forever
  );

  const totalGames = games.length;

  const totalHours =
    games.reduce(
      (acc, game) =>
        acc + (game.playtime_forever || 0),
      0
    ) / 60;

  return {
    totalGames,
    totalHours: Math.round(totalHours),
    games: games.slice(0, 12)
  };
};

module.exports = {
  getSteamStats,
  ValidationError
};