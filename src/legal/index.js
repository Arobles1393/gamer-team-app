import * as es from "./content/es";
import { LEGAL_FALLBACK_LANGUAGE, PENDING_MARK } from "./legalConfig";

export * from "./legalConfig";

// Contenido por idioma. Solo hay español por ahora: para agregar otro,
// crear content/{idioma}.js con la misma forma y sumarlo aquí
const CONTENT = { es };

// Documento ("terms" | "privacy") en el idioma pedido, o en español si no
// existe. fallback: true si se mostró en otro idioma que el pedido
export const getLegalDocument = (type, language) => {
  const lang = CONTENT[language]?.[type] ? language : LEGAL_FALLBACK_LANGUAGE;
  const document = CONTENT[lang][type];
  return {
    document,
    language: lang,
    fallback: lang !== language,
    isDraft: document.sections.some((section) => section.body.some((paragraph) => paragraph.includes(PENDING_MARK)))
  };
};
