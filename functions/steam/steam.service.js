const axios = require("axios");
const {createTtlCache} = require("../shared/limits");

const steamApi = axios.create({
  baseURL: "https://api.steampowered.com",
  timeout: 8000,
});

class ValidationError extends Error {}

const fetchSteamStats = async ({steamId, appid}) => {
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
            vanityurl: steamId,
          },
        },
    );

    if (resolveRes.data.response.success !== 1) {
      throw new ValidationError(
          "No se pudo resolver el usuario de Steam",
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
              appid,
            },
          },
      ),
      steamApi.get(
          "/ISteamUserStats/GetSchemaForGame/v2/",
          {
            params: {
              key,
              appid,
            },
          },
      ),
      steamApi.get(
          "/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/",
          {
            params: {
              gameid: appid,
            },
          },
      ).catch((error) => {
        console.error(
            "⚠️ No se pudo obtener rareza global de logros:",
            error.message,
        );
        return null;
      }),
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
                item.name === achievement.apiname,
          );

        const global =
          globalAchievements.find(
              (item) =>
                item.name === achievement.apiname,
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
            global?.percent ?
              parseFloat(global.percent) :
              0,
        };
      });

    return {
      achievements: mergedAchievements,
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
          include_played_free_games: true,
        },
      },
  );

  const games =
    gamesRes.data.response.games || [];

  games.sort(
      (a, b) =>
        b.playtime_forever -
      a.playtime_forever,
  );

  const totalGames = games.length;

  const totalHours =
    games.reduce(
        (acc, game) =>
          acc + (game.playtime_forever || 0),
        0,
    ) / 60;

  return {
    totalGames,
    totalHours: Math.round(totalHours),
    games: games.slice(0, 12),
  };
};

// Estadísticas y logros cambian poco: 5 min por Steam ID y juego, para no
// repetir 1-4 llamadas a Steam en cada visita al perfil (auditoría M-09)
const statsCache = createTtlCache({ttlMs: 5 * 60 * 1000, max: 500});

const getSteamStats = async ({steamId, appid} = {}) => {
  const key = typeof steamId === "string" ? `${steamId.trim()}|${appid ?? ""}` : null;
  const cached = key && statsCache.get(key);
  if (cached) return cached;

  const result = await fetchSteamStats({steamId, appid});
  if (key) statsCache.set(key, result);
  return result;
};

// ==========================
// PRESENCIA (listas de jugadores)
// ==========================

// Límite real de GetPlayerSummaries por llamada
const MAX_PRESENCE_IDS = 100;
const STEAM_ID64_REGEX = /^\d{17}$/;
const VANITY_REGEX = /^[\w-]{2,32}$/;

// Vanity URL -> SteamID64. Cambia muy rara vez: se guarda mientras viva
// la instancia para no llamar ResolveVanityURL en cada refresco de la lista.
const vanityCache = new Map();

const resolveVanity = async (vanity, key) => {
  if (vanityCache.has(vanity)) {
    return vanityCache.get(vanity);
  }

  const res = await steamApi.get(
      "/ISteamUser/ResolveVanityURL/v0001/",
      {
        params: {
          key,
          vanityurl: vanity,
        },
      },
  );

  const steamId =
    res.data.response.success === 1 ?
      res.data.response.steamid :
      null;

  vanityCache.set(vanity, steamId);

  return steamId;
};

// Recibe los identificadores tal como salen de los links del perfil
// (SteamID64 o vanity) y devuelve { [identificador]: { personastate, gameextrainfo } }.
// Solo se incluye gameextrainfo si Steam dice que está jugando algo:
// personastate 0 puede ser "desconectado" o "perfil privado", y no se
// distinguen, así que nunca se reporta como desconectado.
const getSteamPresence = async ({steamIds} = {}) => {
  if (!Array.isArray(steamIds) || steamIds.length === 0) {
    throw new ValidationError("steamIds requerido");
  }

  if (steamIds.length > MAX_PRESENCE_IDS) {
    throw new ValidationError(
        `Máximo ${MAX_PRESENCE_IDS} jugadores por consulta`,
    );
  }

  const identifiers = [...new Set(steamIds)];

  if (
    !identifiers.every(
        (id) =>
          typeof id === "string" &&
        (STEAM_ID64_REGEX.test(id) || VANITY_REGEX.test(id)),
    )
  ) {
    throw new ValidationError("steamIds inválidos");
  }

  const key = process.env.STEAM_API_KEY;

  if (!key) {
    throw new Error("API Key no configurada");
  }

  // Identificador -> SteamID64 (los vanity que no existen quedan en null)
  const resolved = await Promise.all(
      identifiers.map(async (id) => [
        id,
      STEAM_ID64_REGEX.test(id) ?
        id :
        await resolveVanity(id, key).catch((error) => {
          console.error(
              "⚠️ No se pudo resolver vanity de Steam:",
              error.message,
          );
          return null;
        }),
      ]),
  );

  const steamId64s = [
    ...new Set(
        resolved
            .map(([, steamId]) => steamId)
            .filter(Boolean),
    ),
  ];

  const presence = {};

  if (steamId64s.length === 0) {
    return {presence};
  }

  // Una sola llamada para toda la lista
  const summaryRes = await steamApi.get(
      "/ISteamUser/GetPlayerSummaries/v0002/",
      {
        params: {
          key,
          steamids: steamId64s.join(","),
        },
      },
  );

  const players =
    summaryRes.data.response?.players || [];

  const bySteamId = new Map(
      players.map((player) => [player.steamid, player]),
  );

  for (const [id, steamId] of resolved) {
    const player = steamId && bySteamId.get(steamId);

    if (!player) continue;

    const playing =
      player.personastate !== 0 && player.gameextrainfo;

    presence[id] = {
      personastate: player.personastate,
      gameextrainfo: playing ? player.gameextrainfo : null,
    };
  }

  return {presence};
};

// PRIVACIDAD: ninguna función de este archivo lee ni devuelve datos de
// salas (lobbysteamid) ni direcciones de servidor (gameserverip). Solo
// steamJoin/getJoinInfo consulta la sala, y solo para quien pasó todas sus
// comprobaciones (lo vigila tests/functions/steam-join.test.cjs).
module.exports = {
  getSteamStats,
  getSteamPresence,
  // Para steamJoin: mismo cliente y misma resolución de vanity URL
  steamApi,
  resolveVanity,
  STEAM_ID64_REGEX,
  VANITY_REGEX,
  ValidationError,
};
