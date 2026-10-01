import i18n from "../i18n";

// Nivel de la partida (posts.skillLevel). null = sin especificar.
// El texto sale de locales/{idioma}/posts.json (posts:skill.{value})
export const SKILL_LEVELS = [
  { value: "casual" },
  { value: "competitive" }
];

export const getSkillLevelLabel = (value) =>
  SKILL_LEVELS.some((level) => level.value === value)
    ? i18n.t(`posts:skill.${value}`)
    : null;
