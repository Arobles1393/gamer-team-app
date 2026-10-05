import { countries } from "../data/countries";
import { getIntlLocale } from "../i18n";

// users.region guarda el nombre en español (value de countries.js); el
// código ISO 3166-1 alpha-2 (code) es la llave para el mapa de la
// comunidad, la Cloud Function y los nombres traducidos.
export const getCountryByCode = (code) => countries.find((c) => c.code === code) ?? null;

// Nombre del país en el idioma actual a partir de su código ("MX" -> "México")
export const getCountryLabelByCode = (code) => {
  const country = getCountryByCode(code);

  try {
    return new Intl.DisplayNames([getIntlLocale()], { type: "region" }).of(code) || country?.label || code;
  } catch {
    return country?.label ?? code;
  }
};

// Nombre del país en el idioma actual a partir de users.region
export const getCountryLabel = (value) => {
  const country = countries.find((c) => c.value === value);
  if (!country) return value || "";
  return getCountryLabelByCode(country.code);
};

// Opciones para el selector de región, con el nombre traducido y ordenadas
// en el idioma actual
export const getCountryOptions = () =>
  countries
    .map((country) => ({ ...country, label: getCountryLabel(country.value) }))
    .sort((a, b) => a.label.localeCompare(b.label, getIntlLocale(), { sensitivity: "base" }));
