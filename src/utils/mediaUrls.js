// De dónde pueden venir las imágenes y adjuntos que se guardan (auditoría
// B-23). La misma lista está en firestore.rules (mediaUrlOk): sin ella,
// cualquiera podía poner un píxel de rastreo como avatar o un adjunto que
// apunta a otro sitio. Si cambia aquí, cambiar también allí.

// Caracteres de URL sin espacios, comillas ni paréntesis (la portada del
// perfil se usa dentro de url(...) en CSS)
const PATH = "/[A-Za-z0-9._~:/?#\\[\\]@!$&*+,;=%-]*$";

const STORAGE = "firebasestorage\\.googleapis\\.com/v0/b/gamerteam-4ed20\\.(firebasestorage\\.app|appspot\\.com)/o";

export const MEDIA_HOSTS = {
  // Archivos subidos por las personas (avatar, portada, adjuntos)
  storage: [STORAGE],
  // Avatar: Storage, la foto de Google o el avatar de Steam
  avatar: [STORAGE, "lh[0-9]\\.googleusercontent\\.com", "([a-z0-9-]+\\.)*steamstatic\\.com"],
  // Partidas: imagen y clip de RAWG, logo y portada de SteamGridDB
  rawg: ["media\\.rawg\\.io"],
  steamgrid: ["cdn[0-9]*\\.steamgriddb\\.com"]
};

const MAX_URL = 2048;

const matchesHost = (url, hosts) =>
  hosts.some((host) => new RegExp(`^https://${host}${PATH}`).test(url));

// La URL si viene de un dominio permitido para ese uso; si no, null
export const allowedMediaUrl = (kind, url) =>
  typeof url === "string" && url.length <= MAX_URL && matchesHost(url, MEDIA_HOSTS[kind] ?? [])
    ? url
    : null;

// Campos de imagen de una partida con su origen
const POST_MEDIA = { image: "rawg", clip: "rawg", logo: "steamgrid", portada: "steamgrid" };

// Copia de los datos de una partida con las imágenes de otro origen en null
// (así una portada inesperada no impide publicar: las reglas la rechazarían)
export const withAllowedPostMedia = (data) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) =>
      key in POST_MEDIA && value != null ? [key, allowedMediaUrl(POST_MEDIA[key], value)] : [key, value]
    )
  );
