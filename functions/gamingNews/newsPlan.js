// Qué escribir y qué borrar en gaming_news en una sincronización. Función
// pura (se prueba sin Firebase): todo va en un solo batch, así el feed nunca
// queda vacío a medias, y si una fuente falla se conservan sus noticias.
const MAX_NEWS_PER_SOURCE = 60;

// existing: [{ id, source }] (lo que hay hoy)
// fresh: [{ id, data: { source, publishedAt, ... } }] (lo que trajeron los feeds)
// okSources: fuentes que respondieron bien
const planNewsSync = (existing, fresh, okSources) => {
  const ok = new Set(okSources);

  // Las más recientes de cada fuente, sin duplicados
  const byId = new Map();
  for (const item of fresh) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  const perSource = new Map();
  for (const item of byId.values()) {
    const list = perSource.get(item.data.source) || [];
    list.push(item);
    perSource.set(item.data.source, list);
  }
  const toSet = [...perSource.values()].flatMap((list) =>
    list
      .sort((a, b) => b.data.publishedAt - a.data.publishedAt)
      .slice(0, MAX_NEWS_PER_SOURCE)
  );

  // Solo se borra lo de fuentes que respondieron y ya no viene
  const keep = new Set(toSet.map((item) => item.id));
  const toDelete = existing
    .filter((doc) => ok.has(doc.source) && !keep.has(doc.id))
    .map((doc) => doc.id);

  return {toSet, toDelete};
};

module.exports = {planNewsSync, MAX_NEWS_PER_SOURCE};
