import DOMPurify from "dompurify";

// HTML de las guías escritas en el editor. Se sanitiza al guardar y otra vez
// al mostrar: el documento se puede escribir saltándose la app, así que el
// HTML guardado nunca se trata como seguro.
const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "s", "h2", "h3",
  "ul", "ol", "li", "blockquote", "code", "pre", "hr", "a", "img"
];
const ALLOWED_ATTR = ["href", "src", "alt", "title", "target", "rel"];

// Instancia propia: sus hooks no afectan a otros usos de DOMPurify
const purify = DOMPurify();

purify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    const href = node.getAttribute("href") || "";

    if (!/^https?:\/\//i.test(href)) {
      node.removeAttribute("href");
    } else {
      // Fuera de la app y sin dar acceso a window.opener
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
  }

  // Solo imágenes https (subidas a Storage o pegadas por URL)
  if (node.tagName === "IMG" && !isSafeImageUrl(node.getAttribute("src"))) {
    node.remove();
  }
});

export const isSafeImageUrl = (value) =>
  typeof value === "string" && /^https:\/\/[^\s"'<>]+$/i.test(value) && value.length <= 2048;

export const sanitizeGuideHtml = (html) =>
  purify.sanitize(html || "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false
  });

// Texto plano (para saber si la guía tiene contenido de verdad). DOMParser
// crea un documento inerte: no descarga las imágenes del HTML.
export const guideHtmlToText = (html) => {
  const doc = new DOMParser().parseFromString(sanitizeGuideHtml(html), "text/html");
  return (doc.body.textContent || "").trim();
};

// Límite del HTML guardado (el mismo que firestore.rules)
export const MAX_GUIDE_HTML = 100000;
