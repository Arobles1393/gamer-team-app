// Enlace de "Apoyar el proyecto". Lista cerrada a propósito: solo
// https://ko-fi.com/..., para que un error de configuración nunca lleve a
// un enlace de pago con otro destino. GamerMatch no envía datos a Ko-fi ni
// recibe datos de pago: es un enlace saliente.
const ALLOWED_HOST = "ko-fi.com";

const warn = (message) => {
  if (process.env.NODE_ENV === "development") console.warn(`[support] ${message}`);
};

// Pura (testeable): la URL normalizada si es válida, si no null
export const parseSupportUrl = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    warn("REACT_APP_SUPPORT_URL no es una URL válida; no se muestra el botón.");
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== ALLOWED_HOST || url.username || url.password) {
    warn(`REACT_APP_SUPPORT_URL debe ser https://${ALLOWED_HOST}/<usuario>; no se muestra el botón.`);
    return null;
  }
  return url.toString();
};

// Create React App incorpora la variable al compilar
export const getSupportUrl = () => parseSupportUrl(process.env.REACT_APP_SUPPORT_URL);
