// Nivel de la partida (posts.skillLevel). null = sin especificar
export const SKILL_LEVELS = [
  { label: "Casual", value: "casual" },
  { label: "Competitivo", value: "competitive" }
];

export const getSkillLevelLabel = (value) =>
  SKILL_LEVELS.find((level) => level.value === value)?.label ?? null;
