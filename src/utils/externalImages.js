import { MEDIA_HOSTS, allowedMediaUrl } from "./mediaUrls";

// Imágenes de las guías (portada, imágenes del texto y vista previa de un
// enlace): pueden venir de cualquier sitio, que recibiría la IP de cada
// lector. Las de sitios que no son nuestros (Storage) ni los que la app ya
// usa (RAWG, SteamGridDB, Steam, Google) no se cargan solas: se muestra un
// botón "Mostrar imagen de <sitio>" y solo se piden al pulsarlo.

// La URL viene de un sitio de confianza (cualquiera de mediaUrls)
export const isTrustedImageUrl = (url) =>
  Object.keys(MEDIA_HOSTS).some((kind) => allowedMediaUrl(kind, url) !== null);

// Sitio de una URL para el botón (sin www.); "" si no es una URL
export const imageHost = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/**
 * HTML de una guía (YA sanitizado) con las imágenes externas cambiadas por
 * <button class="guide-external-image" data-index="n">. revealed: índices
 * (entre todas las <img> del HTML) que ya se pidió mostrar. label(host): el
 * texto del botón. DOMParser crea un documento inerte: no descarga nada.
 */
export const markExternalImages = (html, { revealed = new Set(), label }) => {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  [...doc.body.querySelectorAll("img")].forEach((img, index) => {
    img.setAttribute("referrerpolicy", "no-referrer");
    img.setAttribute("loading", "lazy");
    if (isTrustedImageUrl(img.getAttribute("src")) || revealed.has(index)) return;

    const button = doc.createElement("button");
    button.type = "button";
    button.className = "guide-external-image";
    button.dataset.index = String(index);
    const icon = doc.createElement("i");
    icon.className = "pi pi-image";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon, doc.createTextNode(label(imageHost(img.getAttribute("src")))));
    img.replaceWith(button);
  });
  return doc.body.innerHTML;
};
