// Traducciones: locales/{idioma}/{namespace}.json. Se cargan todas al
// arrancar (son pocas y pequeñas). Para agregar un idioma basta con crear
// su carpeta y sumarlo a APP_LANGUAGES en i18n.js.
const context = require.context("./", true, /^\.\/[a-z]{2}\/[a-z]+\.json$/);

export const resources = context.keys().reduce((all, key) => {
  const [, language, namespace] = key.match(/^\.\/([a-z]{2})\/([a-z]+)\.json$/);
  all[language] = { ...all[language], [namespace]: context(key) };
  return all;
}, {});

export const NAMESPACES = [
  "common",
  "auth",
  "posts",
  "chat",
  "friends",
  "notifications",
  "profile",
  "reports",
  "guides"
];
