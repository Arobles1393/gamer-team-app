import { languages } from "../data/languages";

// Idioma de la partida (posts.language = código ISO 639-1). La lista
// completa vive en data/languages.js, como countries.js para la región.
export const LANGUAGES = languages;

// Idioma que se da por hecho: no lleva badge en la card
export const DEFAULT_LANGUAGE = "es";

export const getLanguageLabel = (value) =>
  LANGUAGES.find((language) => language.value === value)?.label ?? null;
