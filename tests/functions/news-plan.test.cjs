// Sincronización de noticias (functions/gamingNews/newsPlan.js): un solo
// batch, sin vaciar el feed y conservando lo de una fuente que falló.
const path = require("path");
const { planNewsSync, MAX_NEWS_PER_SOURCE } = require(path.join(__dirname, "../../functions/gamingNews/newsPlan.js"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const item = (id, source, minutesAgo = 0) => ({ id, data: { source, publishedAt: new Date(Date.now() - minutesAgo * 60000) } });

console.log("\n=== sincronización de noticias");
{
  const existing = [{ id: "a", source: "IGN" }, { id: "b", source: "IGN" }, { id: "g1", source: "GameSpot" }];
  const fresh = [item("b", "IGN"), item("c", "IGN"), item("g2", "GameSpot")];
  const { toSet, toDelete } = planNewsSync(existing, fresh, ["IGN", "GameSpot"]);
  check("escribe todas las nuevas", toSet.map((x) => x.id).sort().join() === "b,c,g2");
  check("borra solo las que ya no vienen", toDelete.sort().join() === "a,g1", toDelete.join());
}
{
  const existing = [{ id: "a", source: "IGN" }, { id: "g1", source: "GameSpot" }];
  const fresh = [item("c", "IGN")];
  const { toDelete } = planNewsSync(existing, fresh, ["IGN"]);
  check("si GameSpot falla, sus noticias se conservan", !toDelete.includes("g1") && toDelete.includes("a"), toDelete.join());
}
{
  const fresh = [item("x", "IGN"), item("x", "IGN")];
  const { toSet } = planNewsSync([], fresh, ["IGN"]);
  check("sin duplicados", toSet.length === 1);
}
{
  const fresh = Array.from({ length: MAX_NEWS_PER_SOURCE + 20 }, (_, i) => item(`n${i}`, "IGN", i));
  const { toSet } = planNewsSync([], fresh, ["IGN"]);
  check(`como máximo ${MAX_NEWS_PER_SOURCE} por fuente, las más recientes`, toSet.length === MAX_NEWS_PER_SOURCE && toSet[0].id === "n0" && !toSet.some((x) => x.id === `n${MAX_NEWS_PER_SOURCE + 5}`));
}
{
  const { toSet, toDelete } = planNewsSync([{ id: "a", source: "IGN" }], [], []);
  check("sin fuentes que respondan, no se borra nada", toSet.length === 0 && toDelete.length === 0);
}
{
  const existing = Array.from({ length: 300 }, (_, i) => ({ id: `old${i}`, source: i % 2 ? "IGN" : "GameSpot" }));
  const fresh = Array.from({ length: 200 }, (_, i) => item(`new${i}`, i % 2 ? "IGN" : "GameSpot", i));
  const { toSet, toDelete } = planNewsSync(existing, fresh, ["IGN", "GameSpot"]);
  check("cabe en un batch (≤ 500 operaciones) aunque haya 300 viejas", toSet.length + toDelete.length <= 500,
    `${toSet.length} + ${toDelete.length}`);
}

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} OK`);
process.exit(failed ? 1 : 0);
