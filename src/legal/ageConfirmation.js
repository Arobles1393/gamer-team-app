import { MIN_AGE } from "./legalConfig";

// ¿Confirmó la edad mínima vigente? (preferences.ageConfirmation). Si MIN_AGE
// sube, las confirmaciones con una edad menor ya no cuentan
export const hasConfirmedAge = (preferences) =>
  Number(preferences?.ageConfirmation?.minAge) >= MIN_AGE;
