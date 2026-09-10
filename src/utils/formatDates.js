const formatDate = (timestamp) => {
  if (!timestamp) return "";

  const date =
    timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

  return date.toLocaleDateString(
    "es-MX",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
};

const formatChatTime = (timestamp) => {
  if (!timestamp?.seconds) return "";

  const diff =
    Date.now() -
    timestamp.seconds * 1000;

  const minutes =
    Math.floor(diff / 60000);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} h`;
  }

  const days =
    Math.floor(hours / 24);

  return `${days} d`;
};

const formatDateN = (timestamp) => {

  if (!timestamp?.seconds) return "";

  const diff =
    Date.now() -
    timestamp.seconds * 1000;

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Hace unos segundos";
  }

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `Hace ${days} días`;
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 4) {
    return `Hace ${weeks} semanas`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `Hace ${months} meses`;
  }

  const years = Math.floor(days / 365);

  return `Hace ${years} años`;
}

export const formatDates = {
  formatDate,
  formatChatTime,
  formatDateN
}