// Servicios externos que GamerMatch usa de verdad (verificado en src/,
// functions/ y package.json). Solo texto y enlaces a la página principal
// oficial: sin logos ni marcas gráficas.
// category: "data" | "auth" | "infra" | "media" | "support"
// requiresAttribution: true solo para RAWG (su plan gratuito exige un
// enlace activo desde cada página que use sus datos: ver AppFooter).
// Revisar los términos de cada servicio antes de cambiar o quitar una entrada.
export const CREDITS = [
  {
    id: "rawg",
    name: "RAWG",
    url: "https://rawg.io",
    purposeKey: "purpose.rawg",
    category: "data",
    requiresAttribution: true
  },
  {
    id: "steamWebApi",
    name: "Steam Web API",
    url: "https://steamcommunity.com/dev",
    purposeKey: "purpose.steamWebApi",
    category: "data",
    requiresAttribution: false
  },
  {
    id: "twitch",
    name: "Twitch",
    url: "https://www.twitch.tv",
    purposeKey: "purpose.twitch",
    category: "data",
    requiresAttribution: false
  },
  {
    id: "ign",
    name: "IGN",
    url: "https://www.ign.com",
    purposeKey: "purpose.news",
    category: "data",
    requiresAttribution: false
  },
  {
    id: "gamespot",
    name: "GameSpot",
    url: "https://www.gamespot.com",
    purposeKey: "purpose.news",
    category: "data",
    requiresAttribution: false
  },
  {
    id: "naturalEarth",
    name: "Natural Earth",
    url: "https://www.naturalearthdata.com",
    purposeKey: "purpose.naturalEarth",
    category: "data",
    requiresAttribution: false
  },
  {
    id: "steamgriddb",
    name: "SteamGridDB",
    url: "https://www.steamgriddb.com",
    purposeKey: "purpose.steamgriddb",
    category: "media",
    requiresAttribution: false
  },
  {
    id: "youtube",
    name: "YouTube",
    url: "https://www.youtube.com",
    purposeKey: "purpose.youtube",
    category: "media",
    requiresAttribution: false
  },
  {
    id: "steamLogin",
    name: "Steam",
    url: "https://store.steampowered.com",
    purposeKey: "purpose.steamLogin",
    category: "auth",
    requiresAttribution: false
  },
  {
    id: "google",
    name: "Google",
    url: "https://www.google.com",
    purposeKey: "purpose.google",
    category: "auth",
    requiresAttribution: false
  },
  {
    id: "firebase",
    name: "Firebase",
    url: "https://firebase.google.com",
    purposeKey: "purpose.firebase",
    category: "infra",
    requiresAttribution: false
  },
  {
    id: "googleFonts",
    name: "Google Fonts",
    url: "https://fonts.google.com",
    purposeKey: "purpose.googleFonts",
    category: "infra",
    requiresAttribution: false
  },
  {
    id: "kofi",
    name: "Ko-fi",
    url: "https://ko-fi.com",
    purposeKey: "purpose.kofi",
    category: "support",
    requiresAttribution: false
  }
];

export const CREDIT_CATEGORIES = ["data", "media", "auth", "infra", "support"];

export const RAWG_URL = CREDITS.find((credit) => credit.id === "rawg").url;
