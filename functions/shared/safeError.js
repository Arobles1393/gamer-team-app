// Descripción de un error para los logs SIN datos sensibles. El error de
// axios trae su config completa (config.params.key de Steam, el header
// Authorization de SteamGridDB y Twitch): registrar el objeto entero dejaría
// las claves en Cloud Logging (auditoría M-10). Aquí solo tipo, estado HTTP,
// código y mensaje.
const describeError = (error) => {
  if (!error) return "error desconocido";
  if (typeof error !== "object") return String(error).slice(0, 300);

  const parts = [error.name || "Error"];
  const status = error.response?.status;
  if (status) parts.push(`HTTP ${status}`);
  if (error.code) parts.push(String(error.code));

  const message = String(error.message || "").slice(0, 300);
  return message ? `${parts.join(" ")}: ${message}` : parts.join(" ");
};

module.exports = {describeError};
