// Pruebas de firestore.rules en el emulador de Firestore.
// Uso: npm run test:rules                      -> todas las suites
//      RULES_SUITES=chats,friends npm run test:rules  -> solo esas
// Corre dentro de `firebase emulators:exec` con un proyecto demo-, así que
// nunca toca producción. Cada suite empieza con la base vacía.
const fs = require("fs");
const path = require("path");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");

const SUITES = [
  "users-privacy",
  "public-profiles",
  "friends",
  "chats",
  "blocks",
  "counters",
  "posts-delete",
  "queries",
  "text-lengths",
  "guides",
  "matching",
  "email-verification",
  "private-preferences"
];

const results = [];

// Una prueba: si lanza, falla (con el primer renglón del error)
const test = async (name, fn) => {
  try {
    await fn();
    results.push(true);
    console.log(`  OK    ${name}`);
  } catch (error) {
    results.push(false);
    console.log(`  FALLA ${name}\n        ${error.message.split("\n")[0]}`);
  }
};

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.error("Falta el emulador: corre `npm run test:rules` (no node directamente).");
    process.exit(1);
  }

  const only = (process.env.RULES_SUITES || "").split(",").filter(Boolean);
  const suites = only.length ? SUITES.filter((name) => only.includes(name)) : SUITES;

  const env = await initializeTestEnvironment({
    projectId: "demo-gamermatch",
    firestore: { rules: fs.readFileSync(path.join(__dirname, "../../firestore.rules"), "utf8") }
  });

  for (const name of suites) {
    console.log(`\n=== ${name}`);
    await env.clearFirestore();
    await require(`./${name}.rules.cjs`)({ env, test, expect });
  }

  await env.cleanup();

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} pruebas OK${failed ? ` (${failed} fallaron)` : ""}`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
