import { languages } from "../data/languages";
import { getIntlLocale } from "../i18n";

// Idioma de la partida (posts.language = código ISO 639-1). La lista
// completa vive en data/languages.js, como countries.js para la región.
export const LANGUAGES = languages;

// Idioma que se da por hecho: no lleva badge en la card
export const DEFAULT_LANGUAGE = "es";

// Nombre del idioma en el idioma de la interfaz ("Inglés", "English",
// "Anglais"...). Si Intl no lo conoce, el nombre en español de la lista.
export const getLanguageLabel = (value) => {
  const language = LANGUAGES.find((item) => item.value === value);
  if (!language) return null;

  try {
    const name = new Intl.DisplayNames([getIntlLocale()], { type: "language", fallback: "none" }).of(value);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : language.label;
  } catch {
    return language.label;
  }
};

// Opciones del selector de idioma, traducidas y ordenadas en el idioma actual
export const getLanguageOptions = () =>
  LANGUAGES
    .map((language) => ({ value: language.value, label: getLanguageLabel(language.value) }))
    .sort((a, b) => a.label.localeCompare(b.label, getIntlLocale(), { sensitivity: "base" }));
