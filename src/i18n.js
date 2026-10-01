import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { addLocale, locale as setPrimeLocale } from "primereact/api";
import { resources, NAMESPACES } from "./locales";

// Idiomas de la interfaz. `locale` es la etiqueta para Intl (fechas,
// números, nombres de países). Para sumar uno: su carpeta en locales/ y
// una entrada aquí.
export const APP_LANGUAGES = [
  { code: "es", name: "Español", locale: "es-MX" },
  { code: "en", name: "English", locale: "en-US" },
  { code: "pt", name: "Português", locale: "pt-BR" },
  { code: "fr", name: "Français", locale: "fr-FR" }
];

export const DEFAULT_APP_LANGUAGE = "es";
// Clave de localStorage donde el detector guarda la elección del usuario
export const LANGUAGE_STORAGE_KEY = "gm-language";

const SUPPORTED = APP_LANGUAGES.map((language) => language.code);

export const isAppLanguage = (code) => SUPPORTED.includes(code);

// Idioma actual de la app ("es", "en"...)
export const getAppLanguage = () =>
  isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_APP_LANGUAGE;

// Etiqueta para Intl del idioma actual ("es-MX", "en-US"...)
export const getIntlLocale = () =>
  APP_LANGUAGES.find((language) => language.code === getAppLanguage()).locale;

// ---------- PrimeReact (Calendar, Dropdown, ConfirmDialog...) ----------
// Los nombres de días y meses salen de Intl: no se traducen a mano.
const buildPrimeLocale = (code) => {
  const { locale } = APP_LANGUAGES.find((language) => language.code === code);
  const t = i18n.getFixedT(code, "common");
  const days = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i)); // domingo..sábado
  const months = Array.from({ length: 12 }, (_, i) => new Date(2024, i, 1));
  const format = (date, options) => new Intl.DateTimeFormat(locale, options).format(date);

  return {
    firstDayOfWeek: code === "en" ? 0 : 1,
    dayNames: days.map((d) => format(d, { weekday: "long" })),
    dayNamesShort: days.map((d) => format(d, { weekday: "short" }).replace(".", "")),
    dayNamesMin: days.map((d) => format(d, { weekday: "narrow" })),
    monthNames: months.map((d) => format(d, { month: "long" })),
    monthNamesShort: months.map((d) => format(d, { month: "short" }).replace(".", "")),
    today: t("prime.today"),
    clear: t("prime.clear"),
    accept: t("actions.yes"),
    reject: t("actions.no"),
    chooseDate: t("prime.chooseDate"),
    chooseTime: t("prime.chooseTime"),
    emptyMessage: t("prime.emptyMessage"),
    emptyFilterMessage: t("prime.emptyFilterMessage"),
    searchMessage: t("prime.searchMessage"),
    selectionMessage: t("prime.selectionMessage")
  };
};

const syncLanguage = (code) => {
  const language = isAppLanguage(code) ? code : DEFAULT_APP_LANGUAGE;

  addLocale(language, buildPrimeLocale(language));
  setPrimeLocale(language);

  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: NAMESPACES,
    defaultNS: "common",
    // Español es la base: si falta una clave en otro idioma, se usa la de español
    fallbackLng: DEFAULT_APP_LANGUAGE,
    supportedLngs: SUPPORTED,
    // "en-US" del navegador cuenta como "en"
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: { escapeValue: false },
    // 1) lo que eligió el usuario (localStorage), 2) el navegador, 3) español.
    // Al iniciar sesión, users/{uid}.language gana (ver useAccountLanguage).
    // caches vacío: solo se guarda una elección explícita (setAppLanguage),
    // no lo que se detectó del navegador.
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: []
    }
  });

syncLanguage(i18n.resolvedLanguage);
i18n.on("languageChanged", syncLanguage);

const storage = {
  set: (code) => {
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, code); } catch { /* modo privado */ }
  },
  clear: () => {
    try { localStorage.removeItem(LANGUAGE_STORAGE_KEY); } catch { /* modo privado */ }
  }
};

// Elección explícita (selector del perfil o idioma guardado en la cuenta):
// se recuerda en este dispositivo
export const setAppLanguage = (code) => {
  if (!isAppLanguage(code)) return Promise.resolve();
  storage.set(code);
  return i18n.changeLanguage(code);
};

// Al cerrar sesión: se olvida la elección de esa cuenta y se vuelve a
// detectar por el navegador (así la siguiente cuenta no hereda el idioma)
export const resetAppLanguage = () => {
  storage.clear();
  return i18n.changeLanguage();
};

export default i18n;
