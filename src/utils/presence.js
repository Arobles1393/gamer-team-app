import { formatDates } from "./formatDates";

// La presencia se actualiza cada 30 s: 2 min de margen para "en línea"
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export const getLastSeenMs = (lastSeen) => {
  if (!lastSeen) return null;
  if (lastSeen.toMillis) return lastSeen.toMillis();
  if (lastSeen.seconds) return lastSeen.seconds * 1000;
  return new Date(lastSeen).getTime() || null;
};

export const isOnline = (lastSeen) => {
  const lastSeenMs = getLastSeenMs(lastSeen);
  return lastSeenMs !== null && Date.now() - lastSeenMs < ONLINE_WINDOW_MS;
};

// Texto de estado: "En línea", "Visto hace 5 min" o "Desconectado"
export const getPresenceLabel = (lastSeen) => {
  if (isOnline(lastSeen)) return "En línea";
  if (getLastSeenMs(lastSeen)) return `Visto hace ${formatDates.formatChatTime(lastSeen)}`;
  return "Desconectado";
};
