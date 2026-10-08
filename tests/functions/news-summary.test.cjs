// Noticias: solo un resumen corto del feed, nunca el artículo completo
// (functions/gamingNews/newsSummary.js). Sin Firebase ni internet.
const path = require("path");
const { summarize, MAX_SUMMARY_CHARS } = require(path.join(__dirname, "../../functions/gamingNews/newsSummary.js"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

console.log("\n=== resumen de noticias");
check("el límite es de 280 caracteres", MAX_SUMMARY_CHARS === 280);
check("un texto corto queda igual", summarize("Nuevo tráiler del juego.") === "Nuevo tráiler del juego.");
check("vacío o sin valor -> cadena vacía", summarize("") === "" && summarize(undefined) === "" && summarize(null) === "");
check("normaliza espacios y saltos de línea", summarize("  Uno\n\n dos\tTres  ") === "Uno dos Tres");

const article = "August has arrived, marking the final month of the season. ".repeat(200);
const short = summarize(article);
check("un artículo completo se recorta a 280 + …", short.length <= MAX_SUMMARY_CHARS + 1 && short.endsWith("…"), `${article.length} -> ${short.length}`);
const words = new Set(article.split(/[\s.,]+/).filter(Boolean));
check("no parte palabras", words.has(short.slice(0, -1).split(" ").pop()), short.slice(-20));
check("sin puntuación suelta antes de …", !/[\s.,;:]…$/.test(short));
const noSpaces = "a".repeat(1000);
check("texto sin espacios: corte duro", summarize(noSpaces) === `${"a".repeat(280)}…`);
check("justo 280 caracteres: sin …", summarize("b".repeat(280)) === "b".repeat(280));

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} OK`);
process.exit(failed ? 1 : 0);
