import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getLegalDocument } from "../../legal";

// Documento legal ("terms" | "privacy") en el idioma de la interfaz; si no
// existe en ese idioma, en español con fallback: true (la página lo avisa)
export const useLegalDocument = (type) => {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "es";

  return useMemo(() => getLegalDocument(type, language), [type, language]);
};
