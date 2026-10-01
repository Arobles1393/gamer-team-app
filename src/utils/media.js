// Límite de adjuntos (comentarios y chat): el mismo que storage.rules
export const MAX_MEDIA_MB = 20;
export const MAX_MEDIA_BYTES = MAX_MEDIA_MB * 1024 * 1024;

// Tipos que acepta el chat además de imágenes y videos (ver storage.rules)
export const CHAT_FILE_ACCEPT = "image/*,video/*,.pdf,.doc,.docx,.zip";

// "image" | "video" | "file" según el MIME del archivo
export const getMediaType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
};

// 2516582 -> "2.4 MB"
export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }

  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
};
