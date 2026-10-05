// Mapa de la comunidad: conteos agregados por país
// (functions/community/community.service.js). Sin Firebase ni internet.
// Uso: npm run test:functions
const path = require("path");
const service = require(path.join(__dirname, "../../functions/community/community.service.js"));
const { REGION_CODES } = require(path.join(__dirname, "../../functions/community/regions.js"));
const { aggregateActiveUsers, MIN_COUNT_PER_COUNTRY, MIN_ACTIVE_TO_SHOW_MAP } = service;

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const VALORANT = 766;
const FORTNITE = 47137;
const rows = (count, region, gameIds = [VALORANT]) => Array.from({ length: count }, () => ({ region, gameIds }));

// 12 México (8 Valorant + 4 Fortnite), 5 España, 3 Chile, 1 Argentina,
// 2 sin región y 1 con una región que no existe = 21 con país
const sample = [
  ...rows(8, "México", [VALORANT, FORTNITE]),
  ...rows(4, "México", [FORTNITE]),
  ...rows(5, "España"),
  ...rows(3, "Chile"),
  ...rows(1, "Argentina", [FORTNITE]),
  ...rows(2, null),
  ...rows(1, "Narnia")
];

(async () => {
  console.log("\n=== constantes");
  check("MIN_COUNT_PER_COUNTRY = 5 y MIN_ACTIVE_TO_SHOW_MAP = 20", MIN_COUNT_PER_COUNTRY === 5 && MIN_ACTIVE_TO_SHOW_MAP === 20);
  check("regions.js tiene los 193 países del cliente", Object.keys(REGION_CODES).length === 193 && REGION_CODES["México"] === "MX");

  console.log("\n=== enmascarado");
  const all = aggregateActiveUsers(sample);
  check("total ignora región null y desconocida (21 -> 20 aproximado por haber enmascarados)",
    all.total === 20 && all.approximate === true, `${all.total} ${all.approximate}`);
  check("ready con 21 >= 20", all.ready === true);
  check("México 12 -> número exacto", all.countries.MX?.count === 12 && !all.countries.MX.masked);
  check("España 5 (justo el mínimo) -> número exacto", all.countries.ES?.count === 5);
  check("Chile 3 -> enmascarado, sin número", all.countries.CL?.masked === true && all.countries.CL.count === null);
  check("Argentina 1 -> enmascarado", all.countries.AR?.masked === true && all.countries.AR.count === null);
  check("4 -> enmascarado (límite de 1-4 vs 5+)",
    aggregateActiveUsers([...rows(4, "Perú"), ...rows(20, "México")]).countries.PE?.masked === true);
  check("países con 0 no aparecen", !("BR" in all.countries) && Object.keys(all.countries).sort().join() === "AR,CL,ES,MX",
    Object.keys(all.countries).join());
  const exact = aggregateActiveUsers([...rows(12, "México"), ...rows(9, "España")]);
  check("sin países enmascarados el total es exacto", exact.total === 21 && exact.approximate === false);
  const leak = aggregateActiveUsers(sample, VALORANT, { minActive: 1 });
  check("el total no permite despejar un enmascarado (16 - 8 - 5 = 3)", leak.total === 10 && leak.approximate === true, leak.total);
  check("ninguna fila ni dato de usuario en la respuesta",
    JSON.stringify(Object.keys(all).sort()) === JSON.stringify(["approximate", "countries", "ready", "total"])
    && Object.values(all.countries).every((c) => Object.keys(c).every((k) => ["count", "masked"].includes(k))));

  console.log("\n=== filtro por juego");
  const valorant = aggregateActiveUsers(sample, VALORANT, { minActive: 1 });
  check("Valorant: México 8, España 5, Chile enmascarado", valorant.countries.MX?.count === 8
    && valorant.countries.ES?.count === 5 && valorant.countries.CL?.masked && !valorant.countries.AR, JSON.stringify(valorant.countries));
  const fortnite = aggregateActiveUsers(sample, FORTNITE, { minActive: 1 });
  check("Fortnite: México 12, Argentina enmascarado, sin España", fortnite.countries.MX?.count === 12
    && fortnite.countries.AR?.masked && !fortnite.countries.ES, JSON.stringify(fortnite.countries));
  const valorantExact = aggregateActiveUsers(sample.filter((row) => row.region !== "Chile"), VALORANT, { minActive: 1 });
  check("el total cambia con el filtro (Valorant 13 exacto)", valorantExact.total === 13 && !valorantExact.approximate, valorantExact.total);

  console.log("\n=== masa crítica");
  const small = aggregateActiveUsers(rows(19, "México"));
  check("19 activos -> ready false y sin países", small.ready === false && Object.keys(small.countries).length === 0);
  check("20 activos -> ready true", aggregateActiveUsers(rows(20, "México")).ready === true);
  const filteredSmall = aggregateActiveUsers(sample, FORTNITE);
  check("con filtro también: 13 de Fortnite -> ready false, sin datos parciales",
    filteredSmall.ready === false && Object.keys(filteredSmall.countries).length === 0);

  console.log("\n=== juegos guardados como objetos");
  check("toGameIds saca los ids de users.games", JSON.stringify(service.toGameIds([{ id: 766, name: "Valorant" }, { id: "47137" }, { name: "sin id" }, null])) === "[766,47137]");

  console.log("\n=== validación de gameId");
  for (const bad of [-1, 0, 1.5, "766", {}, true]) {
    let validation = false;
    try {
      await service.getCommunityStats({ gameId: bad });
    } catch (error) {
      validation = error instanceof service.ValidationError;
    }
    check(`rechaza gameId ${JSON.stringify(bad)}`, validation);
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} pruebas OK${failed ? ` (${failed} fallaron)` : ""}`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
