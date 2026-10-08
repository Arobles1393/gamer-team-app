import { CREDITS, CREDIT_CATEGORIES } from "./credits";
import es from "../locales/es/credits.json";
import en from "../locales/en/credits.json";
import pt from "../locales/pt/credits.json";
import fr from "../locales/fr/credits.json";

const LOCALES = { es, en, pt, fr };
const get = (obj, key) => key.split(".").reduce((acc, part) => acc?.[part], obj);

describe("credits.js", () => {
  test("ids únicos", () => {
    const ids = CREDITS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test.each(CREDITS.map((c) => [c.id, c]))("%s: nombre, URL https y categoría válida", (_, credit) => {
    expect(typeof credit.name).toBe("string");
    expect(credit.name.trim()).not.toBe("");
    const url = new URL(credit.url);
    expect(url.protocol).toBe("https:");
    expect(credit.url).not.toContain("[A COMPLETAR]");
    expect(CREDIT_CATEGORIES).toContain(credit.category);
  });

  test.each(Object.keys(LOCALES))("purposeKey y categorías existen en %s/credits.json", (lang) => {
    for (const credit of CREDITS) {
      expect(typeof get(LOCALES[lang], credit.purposeKey)).toBe("string");
    }
    for (const category of CREDIT_CATEGORIES) {
      expect(typeof get(LOCALES[lang], `category.${category}`)).toBe("string");
    }
  });

  test("solo RAWG exige atribución", () => {
    expect(CREDITS.filter((c) => c.requiresAttribution).map((c) => c.id)).toEqual(["rawg"]);
  });
});
