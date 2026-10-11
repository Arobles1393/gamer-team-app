#!/usr/bin/env node
// Genera los créditos de código abierto a partir de node_modules (sin
// dependencias nuevas). Corre con `npm run credits:generate` y antes de
// cada `npm run build` (prebuild), para que nunca queden desactualizados.
//
// - src/credits/openSourceLibraries.json: dependencias DIRECTAS de
//   producción del package.json de la raíz (nombre, versión, licencia, URL).
// - public/third-party-licenses.txt: TODAS las de producción, incluidas las
//   transitivas, con el texto completo de LICENSE/LICENCE/COPYING y NOTICE.
//
// No incluye herramientas de build o pruebas que CRA declara en
// "dependencies" pero que no llegan al navegador (BUILD_ONLY).
// Avisa (sin fallar) de licencias que no son claramente permisivas.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_JSON = path.join(ROOT, "src/credits/openSourceLibraries.json");
const OUT_TXT = path.join(ROOT, "public/third-party-licenses.txt");

// Solo compilan o prueban la app; no forman parte del bundle
const BUILD_ONLY = new Set([
  "react-scripts",
  "@testing-library/dom",
  "@testing-library/jest-dom",
  "@testing-library/react",
  "@testing-library/user-event"
]);

const PERMISSIVE = new Set([
  "MIT", "ISC", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0", "0BSD", "Unlicense", "CC0-1.0"
]);

const LICENSE_FILE = /^(licen[cs]e|copying)(\.[a-z0-9]+|-[a-z0-9.-]+)?$/i;
const NOTICE_FILE = /^notice(\.[a-z0-9]+)?$/i;

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

// Resolución de Node: node_modules del paquete y de sus carpetas padre
const findPackageDir = (name, fromDir) => {
  let dir = fromDir;
  for (;;) {
    const candidate = path.join(dir, "node_modules", name);
    if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
};

const licenseOf = (pkg) => {
  if (typeof pkg.license === "string") return pkg.license;
  if (pkg.license && typeof pkg.license === "object" && pkg.license.type) return pkg.license.type;
  if (Array.isArray(pkg.licenses) && pkg.licenses.length) {
    const types = pkg.licenses.map((l) => (typeof l === "string" ? l : l.type)).filter(Boolean);
    return types.length > 1 ? `(${types.join(" OR ")})` : types[0];
  }
  return null;
};

const urlOf = (pkg) => {
  if (pkg.homepage) return pkg.homepage;
  const repo = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  if (!repo) return `https://www.npmjs.com/package/${pkg.name}`;
  if (/^[\w.-]+\/[\w.-]+$/.test(repo)) return `https://github.com/${repo}`;
  if (repo.startsWith("github:")) return `https://github.com/${repo.slice(7)}`;
  return repo
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^ssh:\/\/git@/, "https://")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "");
};

// Problema de la licencia, o null si es claramente permisiva
const licenseConcern = (license) => {
  if (!license) return "sin licencia declarada";
  if (/^UNLICENSED$/i.test(license)) return "UNLICENSED (sin permiso de uso)";
  if (/\b(OR|AND|WITH)\b/.test(license) || /[()]/.test(license)) return "expresión compuesta";
  if (/AGPL/i.test(license)) return "AGPL (copyleft fuerte, también por uso en red)";
  if (/LGPL/i.test(license)) return "LGPL (copyleft débil)";
  if (/GPL/i.test(license)) return "GPL (copyleft)";
  if (/^CC-BY/i.test(license)) return "Creative Commons BY (pide atribución)";
  if (/^SEE LICENSE IN/i.test(license)) return "licencia en un archivo propio";
  if (!PERMISSIVE.has(license)) return "licencia no reconocida como permisiva";
  return null;
};

const readNoticeFiles = (dir) => {
  const files = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile());
  const licenseFiles = files.filter((f) => LICENSE_FILE.test(f)).sort();
  const noticeFiles = files.filter((f) => NOTICE_FILE.test(f)).sort();
  return [...licenseFiles, ...noticeFiles].map((f) => ({
    file: f,
    text: fs.readFileSync(path.join(dir, f), "utf8").replace(/\r\n/g, "\n").trim()
  }));
};

const main = () => {
  const rootPkg = readJson(path.join(ROOT, "package.json"));
  const direct = Object.keys(rootPkg.dependencies || {}).filter((name) => !BUILD_ONLY.has(name)).sort();

  // Recorrido de dependencias de producción (dependencies + optionalDependencies)
  const seen = new Map(); // dir -> info
  const missing = [];
  const queue = direct.map((name) => ({ name, from: ROOT }));
  while (queue.length) {
    const { name, from } = queue.shift();
    const dir = findPackageDir(name, from);
    if (!dir) {
      missing.push(name);
      continue;
    }
    if (seen.has(dir)) continue;
    const pkg = readJson(path.join(dir, "package.json"));
    seen.set(dir, { name: pkg.name || name, version: pkg.version, license: licenseOf(pkg), url: urlOf(pkg), dir });
    for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies })) {
      queue.push({ name: dep, from: dir });
    }
  }

  const all = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));

  // Directas, para la página /creditos
  const directInfo = direct.map((name) => {
    const info = all.find((p) => p.name === name && p.dir === findPackageDir(name, ROOT));
    return { name, version: info.version, license: info.license || "UNKNOWN", url: info.url };
  });
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(directInfo, null, 2)}\n`);

  // Textos completos, en su idioma original
  const sep = "=".repeat(78);
  const chunks = [
    "GamerMatch: avisos de terceros / Third-party notices",
    "",
    "Licencias de las librerías de código abierto incluidas en la app",
    "(dependencias de producción, directas y transitivas). Archivo generado",
    "por scripts/generateThirdPartyNotices.js: no editar a mano.",
    "",
    `Paquetes: ${all.length}`,
    ""
  ];
  const withoutFile = [];
  for (const p of all) {
    const files = readNoticeFiles(p.dir);
    chunks.push(sep, `${p.name}@${p.version}`, `License: ${p.license || "UNKNOWN"}`, `URL: ${p.url}`, sep, "");
    if (files.length === 0) {
      withoutFile.push(`${p.name}@${p.version}`);
      chunks.push("(Este paquete no incluye un archivo de licencia / This package does not ship a license file.)", "");
    }
    for (const f of files) {
      chunks.push(`--- ${f.file} ---`, "", f.text, "");
    }
  }
  fs.writeFileSync(OUT_TXT, `${chunks.join("\n")}\n`);

  // Avisos (no falla el build)
  const concerns = all
    .map((p) => ({ ...p, concern: licenseConcern(p.license) }))
    .filter((p) => p.concern);
  console.log(`credits:generate -> ${path.relative(ROOT, OUT_JSON)} (${directInfo.length} directas), ${path.relative(ROOT, OUT_TXT)} (${all.length} paquetes, ${(fs.statSync(OUT_TXT).size / 1024).toFixed(0)} KB)`);
  if (missing.length) console.warn(`  Aviso: no se encontraron en node_modules: ${[...new Set(missing)].join(", ")}`);
  if (withoutFile.length) console.warn(`  Aviso: ${withoutFile.length} paquete(s) sin archivo de licencia: ${withoutFile.join(", ")}`);
  if (concerns.length) {
    console.warn(`  Aviso: ${concerns.length} licencia(s) para revisar:`);
    for (const p of concerns) console.warn(`    - ${p.name}@${p.version}: ${p.license || "(ninguna)"} -> ${p.concern}`);
  }
};

main();
