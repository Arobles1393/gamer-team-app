// Recorte de avatar y portada antes de subirlos. Solo se sube la imagen
// ya recortada (sin el original ni coordenadas). Al pasar por un canvas,
// la salida no conserva metadatos EXIF (ubicación, cámara...).

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
// Para el atributo accept de los <input type="file">
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");
export const MAX_ORIGINAL_MB = 10;
export const MAX_ORIGINAL_BYTES = MAX_ORIGINAL_MB * 1024 * 1024;
// Protección de memoria al decodificar
export const MAX_MEGAPIXELS = 40;

export const AVATAR_OUTPUT = { width: 512, height: 512 };
// Portada 5,5:1. Medida en Mi perfil: 1094x220 (4,97:1) a 1280 px de
// ancho, 1180x220 (5,36:1) a 1366 px y 1254x220 (5,70:1) desde 1440 px,
// donde el contenedor llega a su ancho máximo. 5,5:1 queda entre las
// pantallas de escritorio más comunes; en el diálogo de perfil (~4,5:1) y
// en el celular (~2,4:1) se recortan un poco los costados por
// background-size: cover.
export const BANNER_OUTPUT = { width: 1650, height: 300 };
export const BANNER_ASPECT = BANNER_OUTPUT.width / BANNER_OUTPUT.height;

const OUTPUT_FALLBACK_BG = "#0F0F23";

// null si el archivo sirve; si no, la clave del error
// ("type" | "size" | "missing"). SVG se rechaza aunque sea imagen.
export const validatePickedFile = (file) => {
  if (!file) return "missing";
  if (file.type === "image/svg+xml" || !ALLOWED_IMAGE_TYPES.includes(file.type)) return "type";
  if (file.size > MAX_ORIGINAL_BYTES) return "size";
  return null;
};

export const isTooLarge = (width, height) =>
  !Number.isFinite(width) || !Number.isFinite(height) || width * height > MAX_MEGAPIXELS * 1_000_000;

export const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo leer la imagen"));
    image.src = src;
  });

// Dimensiones reales del archivo (para rechazar imágenes enormes antes de recortar)
export const readImageSize = async (file) => {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
};

const toBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

// Recorta pixelCrop de imageSrc a outputWidth x outputHeight. WebP 0.9; si
// el navegador no lo genera (Safari devuelve PNG), JPEG 0.9 sobre fondo
// oscuro para que las transparencias no queden negras.
export const getCroppedBlob = async (imageSrc, pixelCrop, outputWidth, outputHeight) => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const draw = () =>
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outputWidth, outputHeight);

  draw();
  let blob = await toBlob(canvas, "image/webp", 0.9);

  if (!blob || blob.type !== "image/webp") {
    ctx.clearRect(0, 0, outputWidth, outputHeight);
    ctx.fillStyle = OUTPUT_FALLBACK_BG;
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    draw();
    blob = await toBlob(canvas, "image/jpeg", 0.9);
  }

  if (!blob) throw new Error("No se pudo generar la imagen recortada");
  return blob;
};
