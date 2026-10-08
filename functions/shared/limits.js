// Límites de uso por usuario y caché en memoria (auditoría M-09). Viven
// mientras viva la instancia: no son un límite global exacto (cada instancia
// cuenta por su lado, por eso además hay maxInstances en index.js), pero
// frenan a un usuario que llame en bucle y evitan repetir llamadas a APIs
// externas con cuota (Steam, SteamGridDB, Twitch).

class RateLimitError extends Error {}

// Como máximo `limit` llamadas por clave (uid) en `windowMs`. Las claves sin
// llamadas recientes se descartan para no acumular memoria.
const createRateLimiter = (limit, windowMs, now = () => Date.now()) => {
  const calls = new Map();
  let lastSweep = now();

  return (key) => {
    const t = now();

    if (t - lastSweep > windowMs) {
      for (const [k, times] of calls) {
        if (!times.some((at) => t - at < windowMs)) calls.delete(k);
      }
      lastSweep = t;
    }

    const recent = (calls.get(key) || []).filter((at) => t - at < windowMs);
    if (recent.length >= limit) {
      calls.set(key, recent);
      throw new RateLimitError("rate-limited");
    }
    recent.push(t);
    calls.set(key, recent);
  };
};

// Caché con caducidad y tope de entradas (se descarta la más vieja)
const createTtlCache = ({ttlMs, max = 500}, now = () => Date.now()) => {
  const entries = new Map();

  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (now() - entry.at >= ttlMs) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, {at: now(), value});
      if (entries.size > max) entries.delete(entries.keys().next().value);
    },
    get size() {
      return entries.size;
    },
  };
};

module.exports = {RateLimitError, createRateLimiter, createTtlCache};
