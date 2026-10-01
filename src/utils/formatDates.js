import i18n, { getIntlLocale } from "../i18n";

// Todas las funciones leen el idioma actual de i18next al llamarse; los
// textos ("hace 5 minutos", "ayer", nombres de días) los genera Intl en ese
// idioma, no se traducen a mano.

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

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Mayor unidad que aplica: [valor, unidad de Intl]
const largestUnit = (diff) => {
  if (diff.minutes < 1) return [0, "second"];
  if (diff.minutes < 60) return [diff.minutes, "minute"];
  if (diff.hours < 24) return [diff.hours, "hour"];
  if (diff.days < 7) return [diff.days, "day"];
  if (diff.weeks < 4) return [diff.weeks, "week"];
  if (diff.months < 12) return [diff.months, "month"];
  return [diff.years, "year"];
};

const relativeTime = (value, unit, style = "long") =>
  new Intl.RelativeTimeFormat(getIntlLocale(), { numeric: "auto", style }).format(value, unit);

const timeOfDay = (date) =>
  new Intl.DateTimeFormat(getIntlLocale(), { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);

// "10 sept 2026" / "Sep 10, 2026"
const formatDate = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return "";

  return new Intl.DateTimeFormat(getIntlLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
};

// "Hace 5 minutos" / "5 minutes ago" / "Há 5 minutos"
const formatDateN = (timestamp) => {
  const diff = getTimeDiff(timestamp);
  if (!diff) return "";

  const [value, unit] = largestUnit(diff);
  return capitalize(relativeTime(-value, unit));
};

// Corto para listas: "ahora", "5 min", "3 h", "2 d"... (sin "hace")
const formatChatTime = (timestamp) => {
  const diff = getTimeDiff(timestamp);
  if (!diff) return "";

  const [value, unit] = largestUnit(diff);
  if (unit === "second") return relativeTime(0, "second");

  return new Intl.NumberFormat(getIntlLocale(), {
    style: "unit",
    unit,
    unitDisplay: "narrow"
  }).format(value);
};

// Hora si es de hoy, "Ayer", "Hace 3 días" o la fecha
const formatMessageTime = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return "";

  const diff = getTimeDiff(timestamp);

  if (diff.days === 0) return timeOfDay(date);
  if (diff.days < 7) return capitalize(relativeTime(-diff.days, "day"));

  return formatDate(timestamp);
};

// "Activo ahora" / "Última conexión: hace 5 minutos" / "Desconectado"
const formatLastSeen = (timestamp) => {
  const diff = getTimeDiff(timestamp);
  if (!diff) return i18n.t("common:presence.offline");
  if (diff.minutes < 1) return i18n.t("common:presence.activeNow");

  const [value, unit] = largestUnit(diff);
  return i18n.t("common:presence.lastSeen", { time: relativeTime(-value, unit) });
};

// Hora de una partida programada (en la zona horaria de quien la ve):
// "Hoy 20:00", "Mañana 20:00", "Sáb 20:00" (próximos 6 días) o "4 oct, 20:00"
const formatScheduledTime = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return "";

  const time = timeOfDay(date);

  // Diferencia en días de calendario (no en horas)
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000);

  // "hoy" / "mañana" de Intl (numeric: "auto")
  if (days === 0 || days === 1) return `${capitalize(relativeTime(days, "day"))} ${time}`;

  if (days > 1 && days <= 6) {
    const weekday = new Intl.DateTimeFormat(getIntlLocale(), { weekday: "short" }).format(date).replace(".", "");
    return `${capitalize(weekday)} ${time}`;
  }

  const day = new Intl.DateTimeFormat(getIntlLocale(), { day: "numeric", month: "short" }).format(date).replace(".", "");
  return `${day}, ${time}`;
};

export const formatDates = {
  toDate,
  formatScheduledTime,
  formatDate,
  formatDateN,
  formatChatTime,
  formatMessageTime,
  formatLastSeen
};
