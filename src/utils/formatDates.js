const toDate = (timestamp) => {
  if (!timestamp) return null;

  let date;

  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  return isNaN(date.getTime()) ? null : date;
};

const getTimeDiff = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return null;

  const diffMs = Date.now() - date.getTime();

  return {
    minutes: Math.floor(diffMs / 60000),
    hours: Math.floor(diffMs / 3600000),
    days: Math.floor(diffMs / 86400000),
    weeks: Math.floor(diffMs / (86400000 * 7)),
    months: Math.floor(diffMs / (86400000 * 30)),
    years: Math.floor(diffMs / (86400000 * 365))
  };
};

const formatDate = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return "";

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const formatDateN = (timestamp) => {
  const diff = getTimeDiff(timestamp);
  if (!diff) return "";

  if (diff.minutes < 1) return "Hace unos segundos";
  if (diff.minutes < 60) return `Hace ${diff.minutes} min`;
  if (diff.hours < 24) return `Hace ${diff.hours} h`;
  if (diff.days < 7) return `Hace ${diff.days} días`;
  if (diff.weeks < 4) return `Hace ${diff.weeks} semanas`;
  if (diff.months < 12) return `Hace ${diff.months} meses`;
  return `Hace ${diff.years} años`;
};

const formatChatTime = (timestamp) => {
  const diff = getTimeDiff(timestamp);
  if (!diff) return "";

  if (diff.minutes < 1) return "ahora";
  if (diff.minutes < 60) return `${diff.minutes} min`;
  if (diff.hours < 24) return `${diff.hours} h`;
  if (diff.days < 7) return `${diff.days} d`;
  if (diff.weeks < 4) return `${diff.weeks} sem`;
  if (diff.months < 12) return `${diff.months} mes`;
  return `${diff.years} año${diff.years > 1 ? "s" : ""}`;
};

const formatMessageTime = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return "";

  const diff = getTimeDiff(timestamp);

  if (diff.days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (diff.days === 1) return "Ayer";
  if (diff.days < 7) return `Hace ${diff.days} días`;

  return date.toLocaleDateString();
};

const formatLastSeen = (timestamp) => {
  const diff = getTimeDiff(timestamp);
  if (!diff) return "⚫ Desconectado";

  if (diff.minutes < 1) return "🟢 Activo ahora";
  if (diff.minutes < 60) return `Última conexión: hace ${diff.minutes} min`;
  if (diff.hours < 24) return `Última conexión: hace ${diff.hours} h`;
  if (diff.days < 7) return `Última conexión: hace ${diff.days} día${diff.days > 1 ? "s" : ""}`;
  if (diff.weeks < 4) return `Última conexión: hace ${diff.weeks} semana${diff.weeks > 1 ? "s" : ""}`;
  if (diff.months < 12) return `Última conexión: hace ${diff.months} mes${diff.months > 1 ? "es" : ""}`;
  return `Última conexión: hace ${diff.years} año${diff.years > 1 ? "s" : ""}`;
};

export const formatDates = {
  formatDate,
  formatDateN,
  formatChatTime,
  formatMessageTime,
  formatLastSeen
};