// Protección contra SSRF y lectura de etiquetas Open Graph de la Cloud
// Function fetchLinkPreview (functions/guides/guides.service.js).
// No usa internet: las URLs internas se rechazan antes de conectarse.
// Uso: npm run test:functions
const path = require("path");
const service = require(path.join(__dirname, "../../functions/guides/guides.service.js"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const blockedIps = [
  "169.254.169.254", "127.0.0.1", "127.255.255.254", "10.1.2.3", "172.16.0.1", "172.31.255.255",
  "192.168.1.1", "100.64.0.1", "0.0.0.0", "224.0.0.1",
  "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1",
  "::ffff:169.254.169.254", "::ffff:127.0.0.1", "64:ff9b::a9fe:a9fe", "2002:a9fe:a9fe::"
];
const publicIps = ["8.8.8.8", "1.1.1.1", "172.32.0.1", "::ffff:8.8.8.8", "2606:4700::6810:84e5"];

const blockedUrls = [
  "http://169.254.169.254/computeMetadata/v1/",
  "http://metadata.google.internal/computeMetadata/v1/",
  "http://metadata/computeMetadata/v1/",
  "http://localhost/",
  "http://api.localhost/",
  "http://printer.local/",
  "http://[::1]/",
  "http://[::ffff:169.254.169.254]/",
  "http://0x7f000001/",
  "http://2130706433/",
  "http://10.0.0.1/",
  "https://example.com:8443/",
  "https://user:pass@example.com/"
];

const invalidUrls = ["ftp://example.com/a", "javascript:alert(1)", "file:///etc/passwd", "no es una url", "", null];

(async () => {
  console.log("\n=== direcciones IP");
  for (const ip of blockedIps) check(`bloquea ${ip}`, service.isBlockedAddress(ip) === true);
  for (const ip of publicIps) check(`permite ${ip}`, service.isBlockedAddress(ip) === false);

  console.log("\n=== URLs internas (se rechazan sin conectarse)");
  for (const url of blockedUrls) {
    let blocked = false;
    try {
      service.assertFetchable(service.parseUrl(url));
    } catch (error) {
      blocked = error instanceof service.BlockedAddressError;
    }
    check(`bloquea ${url}`, blocked);
  }

  for (const url of ["http://169.254.169.254/", "http://localhost:5001/"]) {
    const preview = await service.fetchLinkPreview({ url });
    check(`fetchLinkPreview(${url}) devuelve la vista previa vacía`,
      preview.title === null && preview.description === null && preview.image === null);
  }

  console.log("\n=== URLs inválidas (ValidationError)");
  for (const url of invalidUrls) {
    let validation = false;
    try {
      service.parseUrl(url);
    } catch (error) {
      validation = error instanceof service.ValidationError;
    }
    check(`rechaza ${JSON.stringify(url)}`, validation);
  }

  console.log("\n=== etiquetas Open Graph");
  const html = `<!doctype html><html><head>
    <title>Título del head</title>
    <meta property="og:title" content="  Guía de   Jett  ">
    <meta name="description" content="Descripción &amp; más">
    <meta property="og:image" content="/img/portada.jpg">
  </head><body></body></html>`;
  const preview = service.parsePreview(html, new URL("https://guias.example.com/valorant/jett"));
  check("usa og:title y limpia espacios", preview.title === "Guía de Jett", preview.title);
  check("cae a meta description y decodifica entidades", preview.description === "Descripción & más", preview.description);
  check("convierte la imagen relativa en absoluta", preview.image === "https://guias.example.com/img/portada.jpg", preview.image);

  const httpImage = service.parsePreview(`<meta property="og:image" content="http://x.com/a.jpg"><title>t</title>`, new URL("https://x.com"));
  check("descarta imágenes http (solo https)", httpImage.image === null);

  const noMeta = service.parsePreview("<html><head><title>Solo título</title></head></html>", new URL("https://x.com"));
  check("sin og:title usa <title>", noMeta.title === "Solo título" && noMeta.description === null);

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} pruebas OK${failed ? ` (${failed} fallaron)` : ""}`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
