import { countries } from "../data/countries";
import { getIntlLocale } from "../i18n";

// La bandera emoji son dos "regional indicators": 🇩🇪 -> "DE"
const regionCodeFromFlag = (flag = "") => {
  const code = [...flag]
    .map((char) => char.codePointAt(0) - 0x1f1e6)
    .filter((offset) => offset >= 0 && offset < 26)
    .map((offset) => String.fromCharCode(65 + offset))
    .join("");

  return code.length === 2 ? code : null;
};

// Nombre del país en el idioma actual. users.region guarda el nombre en
// español (value de countries.js); eso no cambia, solo cómo se muestra.
export const getCountryLabel = (value) => {
  const country = countries.find((c) => c.value === value);
  if (!country) return value || "";

  const code = regionCodeFromFlag(country.flag);

  try {
    return (code && new Intl.DisplayNames([getIntlLocale()], { type: "region" }).of(code)) || country.label;
  } catch {
    return country.label;
  }
};

// Opciones para el selector de región, con el nombre traducido y ordenadas
// en el idioma actual
export const getCountryOptions = () =>
  countries
    .map((country) => ({ ...country, label: getCountryLabel(country.value) }))
    .sort((a, b) => a.label.localeCompare(b.label, getIntlLocale(), { sensitivity: "base" }));
