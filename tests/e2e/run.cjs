// Pruebas de interfaz contra la app local (http://localhost:3000) con las
// cuentas de prueba qa_*. OJO: la app local usa el Firebase de PRODUCCIÓN,
// así que estas pruebas escriben datos reales en esas cuentas.
//
// Requisitos (ver tests/README.md):
//   - `npm start` corriendo
//   - GOOGLE_APPLICATION_CREDENTIALS apuntando a credenciales del proyecto
//   - cuentas creadas con `npm run qa:setup`
//
// Variables opcionales:
//   E2E_BROWSER   canal del navegador (msedge por defecto; chrome, etc.)
//   E2E_BASE_URL  URL de la app (http://localhost:3000 por defecto)
//   E2E_PUBLISH=1 incluye la prueba de publicar (crea una partida real cada vez)
//   E2E_DELETE_ACCOUNT=1 incluye eliminar cuenta (necesita el emulador de
//                        functions con deleteAccount; tarda ~6 min)
//   E2E_COMMUNITY=1 incluye el mapa de la comunidad (necesita el emulador
//                   de functions con getCommunityStats; tarda ~3 min)
//   E2E_GUIDES_EXTERNAL=1 incluye la guía de link externo (necesita el
//                         emulador de functions con fetchLinkPreview)
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const QA_FILE = path.join(__dirname, ".qa-users.json");

const fail = (message) => {
  console.error(`\n${message}\n`);
  process.exit(1);
};

const node = (file, args = []) =>
  spawnSync(process.execPath, [path.join(__dirname, file), ...args], { stdio: "inherit" }).status === 0;

(async () => {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    fail("Falta GOOGLE_APPLICATION_CREDENTIALS (credenciales para leer y preparar los datos de prueba).");
  }
  if (!fs.existsSync(QA_FILE)) {
    fail("No hay cuentas de prueba: corre primero `npm run qa:setup`.");
  }
  try {
    await fetch(BASE);
  } catch {
    fail(`La app no responde en ${BASE}: corre \`npm start\` primero.`);
  }
  fs.mkdirSync(path.join(__dirname, "screenshots"), { recursive: true });

  console.log("Escribe en producción con las cuentas qa_*. Capturas en tests/e2e/screenshots/\n");

  const core = ["registro", "amistad", "chat", "idioma", "bloqueo", "vacios", "privacidad"];
  if (process.env.E2E_PUBLISH === "1") core.splice(1, 0, "publicar");

  const steps = [
    ["reset.cjs"],
    ["core.e2e.cjs", core],
    ["reset.cjs"],
    ["more.e2e.cjs"],
    ["welcome.e2e.cjs"],
    ["guides.e2e.cjs"],
    ["matching.e2e.cjs"],
    ["account.e2e.cjs"],
    ["legal.e2e.cjs"],
    ["onboarding.e2e.cjs"],
    ["steam-join.e2e.cjs"],
    ["steam-join-ui.e2e.cjs"],
    ["profile-crop.e2e.cjs"],
    // Sin E2E_SUPPORT=1 comprueba que el botón no exista; con él, que el
    // servidor tenga REACT_APP_SUPPORT_URL válida
    ["support.e2e.cjs"],
    ...(process.env.E2E_COMMUNITY === "1" ? [["community.e2e.cjs"]] : []),
    ...(process.env.E2E_DELETE_ACCOUNT === "1" ? [["delete-account.e2e.cjs"]] : []),
    ["reset.cjs"]
  ];

  const failed = steps.filter(([file, args]) => !node(file, args)).map(([file]) => file);

  console.log(failed.length ? `\nFallaron: ${failed.join(", ")}` : "\nTodas las pruebas de interfaz pasaron.");
  process.exit(failed.length ? 1 : 0);
})();
