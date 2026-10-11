// Qué datos viejos u huérfanos se borran (auditoría B-21 y B-31). Funciones
// puras: reciben lo leído de Firestore/Storage y la hora, y devuelven qué
// borrar. cleanup.service.js lee y borra.

const DAY = 24 * 60 * 60 * 1000;

const RETENTION = {
  // Cualquier aviso, leído o no
  notificationDays: 90,
  // Avisos ya leídos
  readNotificationDays: 30,
  // Chat de partida cerrado (o sin partida) sin mensajes nuevos
  inactiveGroupDays: 30,
  // Imagen de guía que ninguna guía usa (subida y abandonada)
  orphanGuideImageDays: 7,
};

// Avisos que apuntan a una partida (relatedId = postId) o a un chat 1:1
const POST_TYPES = new Set(["interested", "comment", "group_message"]);
const CHAT_TYPES = new Set(["message"]);

const millis = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return null;
};

const olderThan = (value, days, now) => {
  const at = millis(value);
  return at !== null && now - at > days * DAY;
};

// notifications: [{id, type, relatedId, read, createdAt}]
// -> [{id, reason}]
const planNotifications = (notifications, {postIds, chatIds, now}) =>
  notifications.flatMap((n) => {
    if (olderThan(n.createdAt, RETENTION.notificationDays, now)) return [{id: n.id, reason: "vieja"}];
    if (n.read === true && olderThan(n.createdAt, RETENTION.readNotificationDays, now)) {
      return [{id: n.id, reason: "leída"}];
    }
    if (POST_TYPES.has(n.type) && n.relatedId && !postIds.has(n.relatedId)) {
      return [{id: n.id, reason: "partida borrada"}];
    }
    if (CHAT_TYPES.has(n.type) && n.relatedId && !chatIds.has(n.relatedId)) {
      return [{id: n.id, reason: "chat borrado"}];
    }
    return [];
  });

// group_chats: [{id, active, lastMessageAt, createdAt}] -> [{id, reason}]
// Solo los cerrados o sin partida, y sin actividad reciente (quien estaba
// en el grupo todavía puede leerlo un tiempo)
const planGroupChats = (groups, {postIds, now}) =>
  groups.flatMap((g) => {
    const closed = g.active === false || !postIds.has(g.id);
    const lastActivity = g.lastMessageAt ?? g.createdAt;
    if (!closed) return [];
    // Sin ninguna fecha: se trata como viejo
    if (millis(lastActivity) !== null && !olderThan(lastActivity, RETENTION.inactiveGroupDays, now)) return [];
    return [{id: g.id, reason: g.active === false ? "cerrado" : "sin partida"}];
  });

// steamNonces: [{id, expiresAt}] -> [{id, reason}]
const planNonces = (nonces, {now}) =>
  nonces.flatMap((n) => {
    const at = millis(n.expiresAt);
    return at !== null && at < now ? [{id: n.id, reason: "vencido"}] : [];
  });

// files: [{name: "guides/uid/123_a.png", updated}] de Storage.
// guidesText: coverImage y content de todas las guías, concatenados. Una
// imagen está en uso si su URL (con la ruta codificada) aparece ahí.
const planGuideImages = (files, {guidesText, now}) =>
  files.flatMap((f) => {
    if (!f.name.startsWith("guides/") || f.name.endsWith("/")) return [];
    if (!olderThan(f.updated, RETENTION.orphanGuideImageDays, now)) return [];
    const used = guidesText.includes(encodeURIComponent(f.name)) || guidesText.includes(f.name);
    return used ? [] : [{id: f.name, reason: "imagen sin guía"}];
  });

module.exports = {
  RETENTION,
  planNotifications,
  planGroupChats,
  planNonces,
  planGuideImages,
};
