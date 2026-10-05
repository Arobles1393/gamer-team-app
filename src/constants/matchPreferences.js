// Preferencias de juego para la compatibilidad (matchProfiles/{uid}).
// Mismos valores permitidos en firestore.rules (matchProfiles).
// Textos en matching:group.{value}, matching:level.{value}, matching:mic.{value}
export const GROUP_SIZES = ["solo", "duo", "squad", "any"];
export const MATCH_SKILL_LEVELS = ["casual", "competitive", "any"];

// requiresMic: true (sí), false (no), null (sin preferencia)
export const MIC_OPTIONS = [
  { value: true, key: "yes" },
  { value: false, key: "no" },
  { value: null, key: "any" }
];

// Idiomas que se pueden marcar (la lista completa tiene 183)
export const MAX_MATCH_LANGUAGES = 5;

export const EMPTY_MATCH_PREFERENCES = {
  schedule: [],
  platforms: [],
  requiresMic: null,
  groupSize: null,
  skillLevel: null,
  languages: [],
  values: []
};

// Configuradas = al menos un dato concreto. Sin ninguno, el usuario no
// entra al ranking de compatibilidad (ni como quien busca ni como
// sugerencia) y al guardar se borra su matchProfile. "any" no cuenta como
// dato: es la forma de quitar el grupo o el nivel una vez elegidos.
const isConcrete = (value) => Boolean(value) && value !== "any";

export const hasMatchPreferences = (preferences) =>
  Boolean(preferences) && (
    preferences.schedule?.length > 0 ||
    preferences.platforms?.length > 0 ||
    preferences.languages?.length > 0 ||
    preferences.values?.length > 0 ||
    preferences.requiresMic === true ||
    preferences.requiresMic === false ||
    isConcrete(preferences.groupSize) ||
    isConcrete(preferences.skillLevel)
  );
