import { hasConfirmedAge } from "./ageConfirmation";
import { MIN_AGE } from "./legalConfig";

describe("hasConfirmedAge", () => {
  it("la edad mínima es 18", () => {
    expect(MIN_AGE).toBe(18);
  });

  it("sin preferencias o sin confirmación: no", () => {
    expect(hasConfirmedAge(null)).toBe(false);
    expect(hasConfirmedAge(undefined)).toBe(false);
    expect(hasConfirmedAge({})).toBe(false);
    expect(hasConfirmedAge({ onboarding: { completed: true } })).toBe(false);
  });

  it("confirmada con la edad vigente: sí", () => {
    expect(hasConfirmedAge({ ageConfirmation: { minAge: 18, confirmedAt: new Date() } })).toBe(true);
  });

  it("confirmada con una edad menor a la vigente: no", () => {
    expect(hasConfirmedAge({ ageConfirmation: { minAge: 13 } })).toBe(false);
  });

  it("datos raros: no", () => {
    expect(hasConfirmedAge({ ageConfirmation: true })).toBe(false);
    expect(hasConfirmedAge({ ageConfirmation: { minAge: "abc" } })).toBe(false);
  });
});
