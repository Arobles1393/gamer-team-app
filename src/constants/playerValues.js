// Lo que cada jugador valora al jugar (matchProfiles.preferences.values).
// Lista FIJA a propósito: no hay texto libre que pueda usarse para insultar
// y el cálculo de compatibilidad es determinístico. Es una autodescripción
// del propio usuario: no existe ningún flujo para marcar esto sobre otra
// persona. El texto sale de matching:values.{value}
export const PLAYER_VALUES = [
  { value: "no_rage" },
  { value: "no_toxicity" },
  { value: "no_quitting" },
  { value: "team_player" },
  { value: "patient_beginners" },
  { value: "positive_attitude" }
];
