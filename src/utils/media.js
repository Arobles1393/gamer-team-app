import { ALLOWED_IMAGE_TYPES } from "./cropImage";

// Límite de adjuntos (comentarios y chat): el mismo que storage.rules, que
// exige tamaño < 20 MB (por eso un archivo de exactamente 20 MB no cabe)
export const MAX_MEDIA_MB = 20;
export const MAX_MEDIA_BYTES = MAX_MEDIA_MB * 1024 * 1024;

export const fitsMediaLimit = (file) => file.size < MAX_MEDIA_BYTES;

// Imágenes que acepta storage.rules (isSafeImageType): sin SVG (auditoría B-21)
const IMAGE_TYPES = ALLOWED_IMAGE_TYPES.join(",");

// Tipos que acepta el chat además de imágenes y videos (ver storage.rules)
export const CHAT_FILE_ACCEPT = `${IMAGE_TYPES},video/*,.pdf,.doc,.docx,.zip`;

// Comentarios: imágenes y videos
export const COMMENT_FILE_ACCEPT = `${IMAGE_TYPES},video/*`;

export const isAllowedCommentFile = (file) => {
  const type = file.type || "";
  return ALLOWED_IMAGE_TYPES.includes(type) || type.startsWith("video/");
};

// Los mismos tipos que acepta storage.rules (isValidChatMedia) en el chat:
// imágenes, videos, PDF, ZIP y Word
export const isAllowedChatFile = (file) => {
  const type = file.type || "";

  return isAllowedCommentFile(file)
    || type === "application/pdf"
    || type === "application/zip"
    || type === "application/x-zip-compressed"
    || type === "application/msword"
    || type.startsWith("application/vnd.openxmlformats-officedocument.");
};

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
