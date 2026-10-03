// Id de 11 caracteres de un video de YouTube a partir de su link, sin llamar
// a ninguna API: youtube.com/watch?v=, youtu.be/, youtube.com/embed/ (y
// shorts/ o live/). Devuelve null si no es un link válido de YouTube.
const ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"];

export const extractYoutubeId = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  let id = null;

  if (host === "youtu.be") {
    id = url.pathname.split("/")[1];
  } else if (HOSTS.includes(host)) {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = match?.[1] ?? null;
    }
  }

  return id && ID.test(id) ? id : null;
};

// Para mostrar el video: dominio de YouTube sin cookies de seguimiento
export const youtubeEmbedUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}`;
