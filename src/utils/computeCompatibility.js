// Compatibilidad entre dos jugadores, de 0 a 100. Función pura (sin
// Firebase ni i18n) para poder probarla y moverla a una Cloud Function si
// algún día se precalcula.
//
// Cada jugador: { preferences, gameIds, region } (matchProfiles/{uid}).
// Devuelve { score, matchedSignals }, o score null si alguno de los dos no
// configuró sus preferencias (no entra al ranking: nunca se inventa un 0%).
//
// matchedSignals: lo que sí coincidió, de mayor a menor peso, como
// { type, icon, values }. El texto lo arma la interfaz con matching:signal.*
// (values son los valores en común: ids de juego, "evening", "pc"...).
import { hasMatchPreferences } from "../constants/matchPreferences";

// Suman 100
export const COMPATIBILITY_WEIGHTS = {
  games: 25,
  schedule: 15,
  platforms: 15,
  skillLevel: 10,
  groupSize: 10,
  languages: 10,
  mic: 5,
  region: 5,
  values: 5
};

const MAX_SIGNALS = 4;

// Si uno de los dos no dijo nada sobre un punto, ese punto vale la mitad:
// ni suma como coincidencia ni resta como diferencia
const NEUTRAL = 0.5;

// Con 3 juegos en común (o todos los del que tiene menos) ya es el máximo
const GAMES_FOR_FULL_SCORE = 3;

const intersect = (a = [], b = []) => {
  const other = new Set(b.map(String));
  return [...new Set(a.map(String))].filter((item) => other.has(item));
};

// Listas (horario, plataformas, idiomas, valores): proporcional a cuánto de
// la lista más corta está en la otra
const listRatio = (a = [], b = []) => {
  if (!a.length || !b.length) return { ratio: NEUTRAL, common: [] };
  const common = intersect(a, b);
  return { ratio: common.length / Math.min(a.length, b.length), common };
};

const gamesRatio = (a = [], b = []) => {
  const common = intersect(a, b);
  if (!a.length || !b.length) return { ratio: 0, common };
  const needed = Math.min(GAMES_FOR_FULL_SCORE, a.length, b.length);
  return { ratio: Math.min(1, common.length / needed), common };
};

// Nivel y tamaño de grupo: iguales o "any" en cualquiera de los dos
const choiceRatio = (a, b) => {
  if (!a || !b) return { ratio: NEUTRAL, common: [] };
  if (a === b) return { ratio: 1, common: a === "any" ? [] : [a] };
  if (a === "any" || b === "any") return { ratio: 1, common: [] };
  return { ratio: 0, common: [] };
};

// Micrófono: ambos sí o ambos no; si alguno no tiene preferencia, neutral
const micRatio = (a, b) => {
  if (typeof a !== "boolean" || typeof b !== "boolean") return { ratio: NEUTRAL, common: [] };
  if (a !== b) return { ratio: 0, common: [] };
  // "Ambos sin micrófono" coincide pero no es algo que valga la pena mostrar
  return { ratio: 1, common: a ? [true] : [] };
};

const regionRatio = (a, b) => {
  if (!a || !b) return { ratio: NEUTRAL, common: [] };
  return a === b ? { ratio: 1, common: [a] } : { ratio: 0, common: [] };
};

const ICONS = {
  games: "pi-star",
  schedule: "pi-clock",
  platforms: "pi-desktop",
  skillLevel: "pi-trophy",
  groupSize: "pi-users",
  languages: "pi-globe",
  mic: "pi-microphone",
  region: "pi-map-marker",
  values: "pi-heart"
};

export const computeCompatibility = (mine, theirs) => {
  const myPrefs = mine?.preferences;
  const otherPrefs = theirs?.preferences;

  if (!hasMatchPreferences(myPrefs) || !hasMatchPreferences(otherPrefs)) {
    return { score: null, matchedSignals: [] };
  }

  const parts = {
    games: gamesRatio(mine.gameIds, theirs.gameIds),
    schedule: listRatio(myPrefs.schedule, otherPrefs.schedule),
    platforms: listRatio(myPrefs.platforms, otherPrefs.platforms),
    skillLevel: choiceRatio(myPrefs.skillLevel, otherPrefs.skillLevel),
    groupSize: choiceRatio(myPrefs.groupSize, otherPrefs.groupSize),
    languages: listRatio(myPrefs.languages, otherPrefs.languages),
    mic: micRatio(myPrefs.requiresMic, otherPrefs.requiresMic),
    region: regionRatio(mine.region, theirs.region),
    values: listRatio(myPrefs.values, otherPrefs.values)
  };

  const score = Math.round(
    Object.entries(COMPATIBILITY_WEIGHTS).reduce(
      (total, [type, weight]) => total + weight * parts[type].ratio,
      0
    )
  );

  // Ya vienen en orden de peso (COMPATIBILITY_WEIGHTS)
  const matchedSignals = Object.keys(COMPATIBILITY_WEIGHTS)
    .filter((type) => parts[type].common.length > 0)
    .slice(0, MAX_SIGNALS)
    .map((type) => ({ type, icon: ICONS[type], values: parts[type].common }));

  return { score: Math.max(0, Math.min(100, score)), matchedSignals };
};
