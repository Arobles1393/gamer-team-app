// Resumen corto de una noticia. Algunos feeds (GameSpot) traen el artículo
// completo en la descripción: solo se guarda un resumen y la tarjeta
// enlaza al artículo original en el sitio de la fuente.
const MAX_SUMMARY_CHARS = 280;

const summarize = (text, max = MAX_SUMMARY_CHARS) => {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  // Corta en el último espacio antes del límite (sin partir palabras)
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:!?¿¡-]+$/u, "")}…`;
};

module.exports = {summarize, MAX_SUMMARY_CHARS};
