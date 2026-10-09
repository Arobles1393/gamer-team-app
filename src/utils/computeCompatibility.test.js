import { computeCompatibility, COMPATIBILITY_WEIGHTS } from "./computeCompatibility";

const player = (preferences, gameIds = [], region = null) => ({ preferences, gameIds, region });

const full = {
  schedule: ["evening", "night"],
  platforms: ["pc", "ps5"],
  skillLevel: "competitive",
  groupSize: "duo",
  languages: ["es", "en"],
  requiresMic: true,
  values: ["chill", "teamwork"]
};

describe("computeCompatibility", () => {
  test("los pesos suman 100", () => {
    expect(Object.values(COMPATIBILITY_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  test("sin preferencias de alguno de los dos: score null (nunca un 0% inventado)", () => {
    expect(computeCompatibility(player(full), player(null))).toEqual({ score: null, matchedSignals: [] });
    expect(computeCompatibility(player({}), player(full)).score).toBeNull();
    expect(computeCompatibility(undefined, player(full)).score).toBeNull();
    // "Me da igual" en todo no es haber configurado nada
    expect(computeCompatibility(player({ groupSize: "any", skillLevel: "any" }), player(full)).score).toBeNull();
  });

  test("idénticos en todo, con 3 juegos y la misma región: 100", () => {
    const me = player(full, [1, 2, 3], "MX");
    const result = computeCompatibility(me, player(full, [3, 2, 1], "MX"));
    expect(result.score).toBe(100);
  });

  test("opuestos en todo lo que ambos dijeron: 0", () => {
    const me = player(full, [1], "MX");
    const other = player({
      schedule: ["morning"], platforms: ["xbox"], skillLevel: "casual", groupSize: "squad",
      languages: ["fr"], requiresMic: false, values: ["tryhard"]
    }, [9], "AR");
    expect(computeCompatibility(me, other)).toEqual({ score: 0, matchedSignals: [] });
  });

  test("lo que uno no dijo vale la mitad (neutral), sin juegos ni región", () => {
    // Solo dicen horario e igual: horario 15 + el resto neutral a la mitad, juegos 0
    const result = computeCompatibility(player({ schedule: ["night"] }), player({ schedule: ["night"] }));
    const neutral = (100 - COMPATIBILITY_WEIGHTS.games - COMPATIBILITY_WEIGHTS.schedule) / 2;
    expect(result.score).toBe(Math.round(COMPATIBILITY_WEIGHTS.schedule + neutral));
  });

  test("listas: proporcional a la lista más corta", () => {
    const me = player({ platforms: ["pc"] });
    const other = player({ platforms: ["pc", "ps5", "xbox"] });
    const half = player({ platforms: ["pc", "ps5"] });
    const withHalf = player({ platforms: ["pc", "switch"] });
    // El resto queda neutral: (100 - juegos 25 - plataformas 15) / 2 = 30
    // pc está en la otra lista -> plataformas completas: 15 + 30
    const all = computeCompatibility(me, other);
    expect(all.score).toBe(45);
    expect(all.matchedSignals[0]).toEqual({ type: "platforms", icon: "pi-desktop", values: ["pc"] });
    // 1 de 2 en común: la mitad de plataformas, 7,5 + 30 = 37,5 -> 38
    expect(computeCompatibility(half, withHalf).score).toBe(38);
  });

  test("juegos: con 3 en común ya es el máximo; los ids se comparan como texto", () => {
    const prefs = { schedule: ["night"] };
    const three = computeCompatibility(player(prefs, [1, 2, 3, 4, 5]), player(prefs, ["1", "2", "3", "9"]));
    const four = computeCompatibility(player(prefs, [1, 2, 3, 4]), player(prefs, [1, 2, 3, 4]));
    expect(three.score).toBe(four.score);
    expect(three.matchedSignals[0]).toEqual({ type: "games", icon: "pi-star", values: ["1", "2", "3"] });
  });

  test("\"any\" en nivel o grupo cuenta como coincidencia, pero no se muestra como señal", () => {
    const me = player({ skillLevel: "any", groupSize: "duo" });
    const other = player({ skillLevel: "competitive", groupSize: "duo" });
    const { matchedSignals } = computeCompatibility(me, other);
    expect(matchedSignals.map((s) => s.type)).toEqual(["groupSize"]);
  });

  test("ambos sin micrófono coincide pero no se muestra; ambos con micrófono sí", () => {
    const noMic = computeCompatibility(player({ requiresMic: false }), player({ requiresMic: false }));
    const mic = computeCompatibility(player({ requiresMic: true }), player({ requiresMic: true }));
    expect(noMic.score).toBe(mic.score);
    expect(noMic.matchedSignals).toEqual([]);
    expect(mic.matchedSignals).toEqual([{ type: "mic", icon: "pi-microphone", values: [true] }]);
  });

  test("como máximo 4 señales, en orden de peso", () => {
    const { matchedSignals } = computeCompatibility(player(full, [1], "MX"), player(full, [1], "MX"));
    expect(matchedSignals.map((s) => s.type)).toEqual(["games", "schedule", "platforms", "skillLevel"]);
  });

  test("el score siempre queda entre 0 y 100 y es entero", () => {
    const samples = [
      [player(full, [1, 2], "MX"), player({ schedule: ["evening"] }, [2], "MX")],
      [player({ values: ["chill"] }), player({ values: ["chill", "x", "y"] }, [], "AR")],
      [player({ groupSize: "duo", skillLevel: "any" }, [1, 2, 3]), player({ groupSize: "trio" }, [4])]
    ];
    for (const [a, b] of samples) {
      const { score } = computeCompatibility(a, b);
      expect(Number.isInteger(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});
