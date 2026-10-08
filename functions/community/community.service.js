const admin = require("firebase-admin");
// Del submódulo: admin.firestore.Timestamp no existe en el emulador
const {Timestamp} = require("firebase-admin/firestore");
const {REGION_CODES} = require("./regions");

// Mapa de la comunidad: cuántos jugadores activos hay por país.
// Solo sale información AGREGADA: ni uids, ni nombres, ni filas de usuario.
// Solo se usa el país que cada quien eligió en su perfil (users.region).

// Activo = tuvo presencia en estos minutos (la app escribe lastSeen cada 2)
const ACTIVE_WINDOW_MINUTES = 5;
// Con menos activos que esto, el país se muestra como "menos de N"
const MIN_COUNT_PER_COUNTRY = 5;
// Con menos activos en total, no se muestra el mapa (ready: false)
const MIN_ACTIVE_TO_SHOW_MAP = 20;
// Tope de seguridad de la consulta
const MAX_ACTIVE_ROWS = 5000;
// Redondeo del total cuando hay países enmascarados
const TOTAL_ROUNDING = 10;
// Una consulta por minuto por instancia, la abra quien la abra
const SNAPSHOT_TTL_MS = 60 * 1000;

class ValidationError extends Error {}

let cache = {at: 0, rows: null, pending: null};

// users.games guarda objetos { id, name, image }: aquí solo importa el id
const toGameIds = (games) =>
  (Array.isArray(games) ? games : [])
      .map((game) => Number(game?.id))
      .filter((id) => Number.isInteger(id) && id > 0);

// Filas mínimas { region, gameIds } de los usuarios activos. Nunca salen
// de la función.
const queryActiveRows = async () => {
  const since = Timestamp.fromMillis(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000);
  const snapshot = await admin.firestore()
      .collection("users")
      .where("lastSeen", ">=", since)
      .select("region", "games")
      .limit(MAX_ACTIVE_ROWS)
      .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {region: data.region ?? null, gameIds: toGameIds(data.games)};
  });
};

const getActiveSnapshot = async () => {
  if (cache.rows && Date.now() - cache.at < SNAPSHOT_TTL_MS) return cache.rows;
  // Si ya hay una consulta en curso, se espera esa (no se lanzan varias)
  if (!cache.pending) {
    cache.pending = queryActiveRows()
        .then((rows) => {
          cache = {at: Date.now(), rows, pending: null};
          return rows;
        })
        .catch((error) => {
          cache.pending = null;
          throw error;
        });
  }
  return cache.pending;
};

// PURA (sin Firebase): conteos por país a partir de las filas.
// gameId: solo cuenta a quien tenga ese juego. Región desconocida o null:
// no cuenta. Países con 1..minCount-1 activos: { count: null, masked: true }.
// Sin masa crítica (total < minActive): countries vacío, ready false.
const aggregateActiveUsers = (
    rows,
    gameId = null,
    {minCount = MIN_COUNT_PER_COUNTRY, minActive = MIN_ACTIVE_TO_SHOW_MAP, regionCodes = REGION_CODES} = {},
) => {
  const counts = {};
  let total = 0;

  for (const row of rows) {
    if (gameId && !(row.gameIds || []).includes(gameId)) continue;
    const code = row.region ? regionCodes[row.region] : null;
    if (!code) continue;
    counts[code] = (counts[code] || 0) + 1;
    total += 1;
  }

  const ready = total >= minActive;
  if (!ready) return {total, approximate: false, countries: {}, ready};

  const countries = {};
  for (const [code, count] of Object.entries(counts)) {
    countries[code] = count >= minCount ? {count} : {count: null, masked: true};
  }

  // Con el total exacto se podría despejar un país enmascarado (total menos
  // los demás). Si hay alguno, el total va redondeado hacia abajo a decenas
  // y se muestra como "más de N".
  const hasMasked = Object.values(countries).some((country) => country.masked);
  if (hasMasked) {
    return {total: Math.floor(total / TOTAL_ROUNDING) * TOTAL_ROUNDING, approximate: true, countries, ready};
  }

  return {total, approximate: false, countries, ready};
};

const parseGameId = (data) => {
  const gameId = data?.gameId;
  if (gameId === undefined || gameId === null) return null;
  if (typeof gameId !== "number" || !Number.isInteger(gameId) || gameId <= 0) {
    throw new ValidationError("gameId debe ser un entero positivo");
  }
  return gameId;
};

const getCommunityStats = async (data) => {
  const gameId = parseGameId(data);
  const rows = await getActiveSnapshot();
  const stats = aggregateActiveUsers(rows, gameId);
  // Sin masa crítica tampoco se dice cuántos hay. minCount: para el texto
  // "menos de N" de los países enmascarados
  return stats.ready ?
    {...stats, minCount: MIN_COUNT_PER_COUNTRY} :
    {total: null, approximate: false, countries: {}, ready: false, minCount: MIN_COUNT_PER_COUNTRY};
};

module.exports = {
  ACTIVE_WINDOW_MINUTES,
  MIN_COUNT_PER_COUNTRY,
  MIN_ACTIVE_TO_SHOW_MAP,
  MAX_ACTIVE_ROWS,
  ValidationError,
  aggregateActiveUsers,
  getActiveSnapshot,
  getCommunityStats,
  toGameIds,
};
