const dns = require("dns");
const net = require("net");
const http = require("http");
const https = require("https");
const cheerio = require("cheerio");

const TIMEOUT_MS = 5000;
// Suficiente para el <head> de cualquier página normal
const MAX_BYTES = 1024 * 1024;
const MAX_REDIRECTS = 3;
const MAX_URL_LENGTH = 2048;
const EMPTY_PREVIEW = { title: null, description: null, image: null };

class ValidationError extends Error {}
// La URL (o una redirección) apunta a una dirección interna: no se pide
class BlockedAddressError extends Error {}

// ---------- Direcciones bloqueadas (SSRF) ----------

// [red, bits]. Incluye 169.254.0.0/16: el servidor de metadatos de GCP
// (169.254.169.254), el caso más peligroso desde una Cloud Function.
const BLOCKED_IPV4 = [
  ["0.0.0.0", 8], // "esta red"
  ["10.0.0.0", 8], // privada
  ["100.64.0.0", 10], // CGNAT (red interna del proveedor)
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local / metadatos de la nube
  ["172.16.0.0", 12], // privada
  ["192.0.0.0", 24], // asignaciones especiales IETF
  ["192.0.2.0", 24], // documentación
  ["192.168.0.0", 16], // privada
  ["198.18.0.0", 15], // pruebas de red
  ["198.51.100.0", 24], // documentación
  ["203.0.113.0", 24], // documentación
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4] // reservada y broadcast
];

const ipv4ToInt = (ip) =>
  ip.split(".").reduce((acc, part) => ((acc << 8) + Number(part)) >>> 0, 0);

const isBlockedIPv4 = (ip) => {
  const value = ipv4ToInt(ip);

  return BLOCKED_IPV4.some(([network, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return ((value & mask) >>> 0) === ((ipv4ToInt(network) & mask) >>> 0);
  });
};

// "::ffff:1.2.3.4" o "fe80::1" -> 8 grupos de 16 bits
const expandIPv6 = (ip) => {
  let address = ip.split("%")[0].toLowerCase();
  const embedded = address.match(/(\d+\.\d+\.\d+\.\d+)$/);

  if (embedded) {
    const v4 = ipv4ToInt(embedded[1]);
    address = address.replace(
      embedded[1],
      `${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`
    );
  }

  const [head, tail = ""] = address.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  const missing = address.includes("::") ? 8 - headParts.length - tailParts.length : 0;

  return [...headParts, ...Array(missing).fill("0"), ...tailParts]
    .map((part) => parseInt(part || "0", 16));
};

const isBlockedIPv6 = (ip) => {
  const groups = expandIPv6(ip);
  const [g0, g1] = groups;
  const embeddedV4 = () =>
    `${groups[6] >> 8}.${groups[6] & 255}.${groups[7] >> 8}.${groups[7] & 255}`;

  if (groups.every((g) => g === 0)) return true; // ::
  if (groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1) return true; // ::1
  if ((g0 & 0xfe00) === 0xfc00) return true; // fc00::/7 privada (ULA)
  if ((g0 & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g0 & 0xff00) === 0xff00) return true; // multicast
  if (g0 === 0x2001 && g1 === 0) return true; // Teredo
  if (g0 === 0x2002) return true; // 6to4 (puede envolver una IPv4 interna)

  // ::ffff:a.b.c.d (IPv4 mapeada) y 64:ff9b::a.b.c.d (NAT64)
  const mapped = groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff;
  const nat64 = g0 === 0x64 && g1 === 0xff9b && groups.slice(2, 6).every((g) => g === 0);
  if (mapped || nat64) return isBlockedIPv4(embeddedV4());

  if (groups.slice(0, 6).every((g) => g === 0)) return true; // ::a.b.c.d (obsoleta)

  return false;
};

const isBlockedAddress = (ip) => {
  if (net.isIPv4(ip)) return isBlockedIPv4(ip);
  if (net.isIPv6(ip)) return isBlockedIPv6(ip);
  return true;
};

// Nombres que siempre son internos (el de metadatos de GCP incluido)
const isBlockedHostname = (hostname) => {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  return host === "localhost"
    || host.endsWith(".localhost")
    || host.endsWith(".local")
    || host.endsWith(".internal")
    // Sin punto: nombres de la red local (p. ej. "metadata")
    || (!host.includes(".") && !net.isIP(host));
};

// ---------- Validación de la URL ----------

const parseUrl = (raw) => {
  if (typeof raw !== "string" || !raw.trim() || raw.length > MAX_URL_LENGTH) {
    throw new ValidationError("URL inválida");
  }

  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ValidationError("URL inválida");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ValidationError("Solo se aceptan links http o https");
  }

  return url;
};

// Lo que hace que una URL bien formada no se pida nunca
const assertFetchable = (url) => {
  // Usuario y contraseña en la URL, o puertos que no son los estándar
  // (evita usar la función para escanear puertos)
  if (url.username || url.password || url.port) {
    throw new BlockedAddressError("URL no permitida");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  if (net.isIP(hostname) ? isBlockedAddress(hostname) : isBlockedHostname(hostname)) {
    throw new BlockedAddressError(`Dirección interna: ${hostname}`);
  }
};

// Resolución de DNS en el momento de conectar: así no hay hueco entre
// "validar la IP" y "conectarse" (DNS rebinding). Si alguna IP del nombre es
// interna, no se conecta.
const safeLookup = (hostname, options, callback) => {
  dns.lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
    if (error) return callback(error);

    const blocked = addresses.find(({ address }) => isBlockedAddress(address));
    if (blocked || addresses.length === 0) {
      return callback(new BlockedAddressError(
        `${hostname} resuelve a una dirección interna (${blocked && blocked.address})`
      ));
    }

    if (options && options.all) return callback(null, addresses);
    return callback(null, addresses[0].address, addresses[0].family);
  });
};

// ---------- Descarga del HTML ----------

// Una petición: { redirect } o { html, finalUrl }. Deja de leer al pasar de
// 1 MB o al terminar el <head>.
const fetchOnce = (url) => new Promise((resolve, reject) => {
  const client = url.protocol === "https:" ? https : http;
  let settled = false;
  let deadline = null;

  const finish = (fn, value) => {
    if (settled) return;
    settled = true;
    clearTimeout(deadline);
    fn(value);
  };

  const request = client.get(url, {
    lookup: safeLookup,
    headers: {
      "User-Agent": "GamerMatchLinkPreview/1.0",
      "Accept": "text/html,application/xhtml+xml"
    }
  }, (response) => {
    const { statusCode, headers } = response;

    if (statusCode >= 300 && statusCode < 400 && headers.location) {
      response.resume();
      return finish(resolve, { redirect: new URL(headers.location, url) });
    }

    if (statusCode < 200 || statusCode >= 300) {
      response.resume();
      return finish(reject, new Error(`HTTP ${statusCode}`));
    }

    if (!/text\/html|application\/xhtml\+xml/i.test(headers["content-type"] || "")) {
      response.resume();
      return finish(reject, new Error(`No es HTML: ${headers["content-type"]}`));
    }

    const chunks = [];
    let size = 0;

    response.on("data", (chunk) => {
      chunks.push(chunk);
      size += chunk.length;

      if (size >= MAX_BYTES || /<\/head>/i.test(chunk.toString("latin1"))) {
        const html = Buffer.concat(chunks).subarray(0, MAX_BYTES).toString("utf8");
        request.destroy();
        finish(resolve, { html, finalUrl: url });
      }
    });
    response.on("end", () => finish(resolve, { html: Buffer.concat(chunks).toString("utf8"), finalUrl: url }));
    response.on("error", (error) => finish(reject, error));
  });

  // Tiempo total de la petición (no solo de inactividad)
  deadline = setTimeout(() => {
    request.destroy();
    finish(reject, new Error("Tiempo de espera agotado"));
  }, TIMEOUT_MS);

  request.on("error", (error) => finish(reject, error));
});

// ---------- Lectura de las etiquetas Open Graph ----------

const clean = (value, max) => {
  const text = (value || "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, max) : null;
};

// Solo imágenes https (una http no carga en una página https)
const absoluteImage = (value, baseUrl) => {
  if (!value) return null;

  try {
    const url = new URL(value.trim(), baseUrl);
    return url.protocol === "https:" && url.href.length <= MAX_URL_LENGTH ? url.href : null;
  } catch {
    return null;
  }
};

const parsePreview = (html, baseUrl) => {
  const $ = cheerio.load(html);
  const meta = (...names) => {
    for (const name of names) {
      const value = $(`meta[property="${name}"]`).attr("content")
        || $(`meta[name="${name}"]`).attr("content");
      if (value && value.trim()) return value;
    }
    return null;
  };

  return {
    title: clean(meta("og:title", "twitter:title") || $("title").first().text(), 200),
    description: clean(meta("og:description", "twitter:description", "description"), 500),
    image: absoluteImage(meta("og:image", "og:image:url", "twitter:image"), baseUrl)
  };
};

// ---------- Función principal ----------

// Vista previa de un link (título, descripción, imagen). Una URL mal formada
// lanza ValidationError; cualquier otra falla (dirección interna, error de
// red, sin HTML...) devuelve la vista previa vacía: compartir el link no debe
// depender de que la vista previa salga.
const fetchLinkPreview = async ({ url: rawUrl } = {}) => {
  let url = parseUrl(rawUrl);

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      // Cada redirección se valida igual que la URL original
      assertFetchable(url);
      const result = await fetchOnce(url);

      if (!result.redirect) {
        return parsePreview(result.html, result.finalUrl);
      }

      url = result.redirect;
      if (url.protocol !== "http:" && url.protocol !== "https:") break;
    }
  } catch (error) {
    const kind = error instanceof BlockedAddressError ? "bloqueada" : "falló";
    console.warn(`Vista previa ${kind} para ${rawUrl}: ${error.message}`);
  }

  return { ...EMPTY_PREVIEW };
};

module.exports = {
  fetchLinkPreview,
  ValidationError,
  BlockedAddressError,
  // Para las pruebas
  isBlockedAddress,
  isBlockedHostname,
  parseUrl,
  assertFetchable,
  parsePreview
};
