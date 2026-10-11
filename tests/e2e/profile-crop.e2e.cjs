// Recorte de avatar y portada antes de subir. Storage no está habilitado
// (plan Spark): se captura en el navegador lo que la app intenta subir
// (formato, tamaño, EXIF, transparencia) y se responde con error, lo que
// también prueba que la vista previa vuelve a la imagen guardada. No se
// escribe nada en producción.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
const SHOTS = `${__dirname}/screenshots`;
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

// Imágenes de prueba generadas en el navegador
const makeImage = (page, { width, height, mime, transparent = false }) =>
  page.evaluate(async ({ width, height, mime, transparent }) => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d");
    if (transparent) {
      // Mitad transparente, mitad roja
      ctx.fillStyle = "rgb(255,0,0)";
      ctx.fillRect(0, 0, width / 2, height);
    } else {
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, "#3b82f6");
      g.addColorStop(1, "#f59e0b");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.font = `${Math.round(height / 6)}px sans-serif`;
      ctx.fillText("GM", width / 3, height / 2);
    }
    const blob = await new Promise((r) => c.toBlob(r, mime, 0.9));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  }, { width, height, mime, transparent }).then((a) => Buffer.from(a));

// JPEG con un bloque EXIF (APP1) insertado tras el SOI
const withExif = (jpeg) => {
  const tiff = Buffer.from("4d4d002a00000008000101100002000000080000001a00000000", "hex");
  const marker = Buffer.from("GPS-SECRETO-QA\0", "latin1");
  const payload = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff, marker]);
  const len = Buffer.alloc(2);
  len.writeUInt16BE(payload.length + 2);
  return Buffer.concat([jpeg.subarray(0, 2), Buffer.from([0xff, 0xe1]), len, payload, jpeg.subarray(2)]);
};
// GIF mínimo de 2 cuadros (animado) 64x64
const tinyGif = () => Buffer.from(
  "4749463839614000400080000000000000ffffff21ff0b4e45545343415045322e300301000000" +
  "21f90404140000002c00000000400040000002" + "4b8c8fa9cbed0fa39cb4da8bb3debcfb0f86e248969ae989a6eacab6ee0bc7f24cd7f68de7face" +
  "f7fe0f0c0a87c4a2f1884c2a97cca6f3098d4aa7d4aaf58acd6ab7dcaef70b0e8bc7e4b2f98c4eab" +
  "d7ecb6fb0d8fcbe7f4bafd8ecfebf7fcbeff0f000" + "3b", "hex");

const imageInfo = (page, bytes) =>
  page.evaluate(async (arr) => {
    const blob = new Blob([new Uint8Array(arr)]);
    const bmp = await createImageBitmap(blob);
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(bmp, 0, 0);
    const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
    return { width: bmp.width, height: bmp.height, left: px(5, Math.floor(bmp.height / 2)), right: px(bmp.width - 5, Math.floor(bmp.height / 2)) };
  }, Array.from(bytes));

(async () => {
  const browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
  const login = async (viewport = { width: 1366, height: 900 }, extra = {}) => {
    const context = await browser.newContext({ locale: "es-MX", viewport, ...extra });
    const page = await context.newPage();
    page.uploads = [];
    page.errors = [];
    page.on("pageerror", (e) => page.errors.push(e.message));
    await page.route("**/firebasestorage.googleapis.com/**", async (route) => {
      const req = route.request();
      if (req.method() === "POST") page.uploads.push({ url: req.url(), headers: req.headers(), body: req.postDataBuffer() });
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: 404, message: "QA: sin Storage" } }) });
    });
    await page.goto(`${BASE}/login`);
    await page.locator("#email").fill(QA.ana.email);
    await page.locator("#password").fill(QA.ana.password);
    await page.locator("button[type=submit]").click();
    await page.waitForURL((u) => !u.pathname.startsWith("/login"));
    await page.goto(`${BASE}/profile`);
    await page.locator(".profile-hero").waitFor();
    return page;
  };
  const input = (page, type) => page.locator('input[type="file"]').nth(type === "avatar" ? 0 : 1);
  const pick = (page, type, name, mimeType, buffer) => input(page, type).setInputFiles({ name, mimeType, buffer });
  const dialog = (page) => page.locator(".image-crop.p-dialog:has(.reactEasyCrop_CropArea)");
  const toastText = async (page) => {
    const t = page.locator(".p-toast-message").last();
    await t.waitFor({ timeout: 8000 }).catch(() => {});
    return (await t.count()) ? (await t.innerText()).replace(/\s+/g, " ") : "";
  };
  const clearToasts = async (page) => { for (let i = 0; i < 10 && await page.locator(".p-toast-icon-close").count(); i++) { await page.locator(".p-toast-icon-close").first().click().catch(() => {}); await page.waitForTimeout(350); } };
  // Aplica y devuelve el cuerpo multipart capturado (la imagen)
  const applyAndCapture = async (page) => {
    const before = page.uploads.length;
    await dialog(page).getByRole("button", { name: "Aplicar" }).click();
    for (let i = 0; i < 40 && page.uploads.length === before; i++) await page.waitForTimeout(250);
    const up = page.uploads[page.uploads.length - 1];
    if (!up || page.uploads.length === before) return null;
    // multipart/related: JSON de metadatos + imagen. Se extrae la parte binaria
    const body = up.body;
    const sep = body.indexOf(Buffer.from("\r\n\r\n", "latin1"), body.indexOf(Buffer.from("Content-Type: image", "latin1")));
    const start = sep + 4;
    const end = body.lastIndexOf(Buffer.from("\r\n--", "latin1"));
    const meta = body.toString("latin1", 0, body.indexOf(Buffer.from("Content-Type: image", "latin1")) + 40);
    return { meta, image: body.subarray(start, end), url: up.url };
  };

  try {
    let page = await login();
    const originalAvatar = await page.locator(".profile-hero .user-avatar img, .profile-hero__avatar img").first().getAttribute("src").catch(() => null);

    // --- rechazos antes del diálogo ---
    console.log("\n=== validación");
    await pick(page, "avatar", "x.svg", "image/svg+xml", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'));
    check("SVG rechazado con aviso", /PNG, JPG, WebP o GIF/.test(await toastText(page)) && !(await dialog(page).isVisible()));
    await clearToasts(page);
    await pick(page, "avatar", "doc.pdf", "application/pdf", Buffer.from("%PDF-1.4"));
    check("PDF rechazado", /PNG, JPG, WebP o GIF/.test(await toastText(page)) && !(await dialog(page).isVisible()));
    await clearToasts(page);
    const big11 = Buffer.concat([await makeImage(page, { width: 400, height: 400, mime: "image/png" }), Buffer.alloc(11 * 1024 * 1024)]);
    await pick(page, "avatar", "grande.png", "image/png", big11);
    check("más de 10 MB rechazado", /10 MB/.test(await toastText(page)));
    await clearToasts(page);
    const huge = await makeImage(page, { width: 8200, height: 5000, mime: "image/png", transparent: true });
    console.log(`     (PNG 8200x5000 = 41 MP, ${(huge.length / 1024).toFixed(0)} KB)`);
    await pick(page, "avatar", "41mp.png", "image/png", huge);
    check("más de 40 megapíxeles rechazado", /40 megapíxeles/.test(await toastText(page)) && !(await dialog(page).isVisible()));
    await clearToasts(page);
    check("accept de los inputs", (await input(page, "avatar").getAttribute("accept")) === "image/png,image/jpeg,image/webp,image/gif"
      && (await input(page, "banner").getAttribute("accept")) === "image/png,image/jpeg,image/webp,image/gif");

    // --- cancelar no sube nada ---
    console.log("\n=== cancelar");
    const vertical = withExif(await makeImage(page, { width: 900, height: 1600, mime: "image/jpeg" }));
    await pick(page, "avatar", "vertical.jpg", "image/jpeg", vertical);
    await dialog(page).waitFor();
    check("título del avatar", /Ajusta tu foto de perfil/i.test(await dialog(page).innerText()));
    check("cuadrícula y guía circular", await dialog(page).locator(".reactEasyCrop_CropAreaGrid.reactEasyCrop_CropAreaRound").count() === 1);
    check("sin aviso de GIF en JPG", !/GIF/.test(await dialog(page).innerText()));
    await dialog(page).getByRole("button", { name: "Cancelar" }).click();
    await dialog(page).waitFor({ state: "hidden" });
    await page.waitForTimeout(800);
    check("cancelar no sube nada", page.uploads.length === 0);

    // --- mismo archivo dos veces vuelve a abrir ---
    await pick(page, "avatar", "vertical.jpg", "image/jpeg", vertical);
    check("elegir el mismo archivo otra vez abre el diálogo", await dialog(page).waitFor({ timeout: 5000 }).then(() => true, () => false));

    // --- zoom y teclado ---
    await page.locator(".reactEasyCrop_CropArea").waitFor();
    const zoomBefore = await page.locator(".reactEasyCrop_Image").evaluate((el) => el.style.transform);
    await dialog(page).getByRole("button", { name: "Acercar", exact: true }).click();
    await dialog(page).getByRole("button", { name: "Acercar", exact: true }).click();
    const zoomAfter = await page.locator(".reactEasyCrop_Image").evaluate((el) => el.style.transform);
    check("botón + acerca", zoomBefore !== zoomAfter && /scale\(1\.4\)/.test(zoomAfter), zoomAfter);
    await page.locator(".reactEasyCrop_CropArea").focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    const moved = await page.locator(".reactEasyCrop_Image").evaluate((el) => el.style.transform);
    check("flechas del teclado mueven la imagen", moved !== zoomAfter, moved);
    check("área con etiqueta accesible", (await page.locator(".reactEasyCrop_CropArea").getAttribute("aria-label")) !== null);
    await dialog(page).screenshot({ path: path.join(SHOTS, "profile-crop-avatar.png") });

    // --- aplicar: salida, EXIF, falla de red revierte ---
    console.log("\n=== aplicar avatar (JPG vertical con EXIF)");
    const cap = await applyAndCapture(page);
    check("sube a avatars/{uid}", cap && cap.url.includes(`avatars%2F${QA.ana.uid}`), cap?.url.slice(0, 120));
    check("contentType image/webp", cap && /image\/webp/.test(cap.meta), cap?.meta.replace(/\s+/g, " ").slice(-80));
    const info = cap && await imageInfo(page, cap.image);
    check("salida 512x512", info && info.width === 512 && info.height === 512, info && `${info.width}x${info.height}`);
    check("sin EXIF (ni el marcador del original)", cap && !cap.image.includes(Buffer.from("Exif\0\0", "latin1")) && !cap.image.includes(Buffer.from("GPS-SECRETO-QA", "latin1")));
    console.log(`     original ${(vertical.length / 1024).toFixed(0)} KB -> recorte ${(cap.image.length / 1024).toFixed(0)} KB`);
    check("al fallar la subida: aviso de error", /No se pudo subir la foto de perfil/.test(await toastText(page)));
    await page.waitForTimeout(800);
    const nowAvatar = await page.locator(".profile-hero .user-avatar img, .profile-hero__avatar img").first().getAttribute("src").catch(() => null);
    check("y la vista previa vuelve a la imagen guardada", nowAvatar === originalAvatar && !String(nowAvatar).startsWith("blob:"), String(nowAvatar).slice(0, 60));
    await clearToasts(page);

    // --- horizontal ---
    console.log("\n=== avatar horizontal");
    await pick(page, "avatar", "h.jpg", "image/jpeg", await makeImage(page, { width: 2400, height: 1000, mime: "image/jpeg" }));
    await dialog(page).waitFor();
    const capH = await applyAndCapture(page);
    const infoH = capH && await imageInfo(page, capH.image);
    check("horizontal -> 512x512", infoH && infoH.width === 512 && infoH.height === 512);
    await clearToasts(page);

    // --- PNG con transparencia ---
    console.log("\n=== PNG transparente");
    await pick(page, "avatar", "t.png", "image/png", await makeImage(page, { width: 800, height: 800, mime: "image/png", transparent: true }));
    await dialog(page).waitFor();
    const capT = await applyAndCapture(page);
    const infoT = capT && await imageInfo(page, capT.image);
    // WebP conserva el canal alfa: el lado transparente sigue transparente (no negro opaco)
    check("WebP con transparencia: no queda negro", infoT && infoT.right[3] === 0, JSON.stringify(infoT && { izq: infoT.left, der: infoT.right }));
    await clearToasts(page);

    // --- GIF ---
    console.log("\n=== GIF");
    const gif = await makeImage(page, { width: 300, height: 300, mime: "image/png" }); // fallback si el GIF manual no decodifica
    let gifBytes = tinyGif();
    const gifOk = await page.evaluate(async (arr) => {
      try { await createImageBitmap(new Blob([new Uint8Array(arr)], { type: "image/gif" })); return true; } catch { return false; }
    }, Array.from(gifBytes));
    if (!gifOk) gifBytes = gif;
    await pick(page, "avatar", "anim.gif", "image/gif", gifBytes);
    await dialog(page).waitFor();
    check("aviso: Los GIF se convertirán en imagen fija", /Los GIF se convertirán en imagen fija/.test(await dialog(page).innerText()), gifOk ? "GIF real" : "GIF simulado");
    const capG = await applyAndCapture(page);
    check("GIF -> WebP fijo", capG && /image\/webp/.test(capG.meta) && capG.image.subarray(0, 4).toString("latin1") === "RIFF");
    await clearToasts(page);

    // --- banner ---
    console.log("\n=== portada");
    await pick(page, "banner", "b.jpg", "image/jpeg", await makeImage(page, { width: 3000, height: 2000, mime: "image/jpeg" }));
    await dialog(page).waitFor();
    check("título de la portada y recorte rectangular", /Ajusta tu portada/i.test(await dialog(page).innerText())
      && await dialog(page).locator(".reactEasyCrop_CropAreaGrid:not(.reactEasyCrop_CropAreaRound)").count() === 1);
    await page.locator(".reactEasyCrop_CropArea").waitFor();
    const cropBox = await page.locator(".reactEasyCrop_CropArea").boundingBox();
    check("relación 5,5:1 en el diálogo", Math.abs(cropBox.width / cropBox.height - 5.5) < 0.05, (cropBox.width / cropBox.height).toFixed(2));
    await dialog(page).screenshot({ path: path.join(SHOTS, "profile-crop-banner.png") });
    const capB = await applyAndCapture(page);
    const infoB = capB && await imageInfo(page, capB.image);
    check("sube a banners/{uid} 1650x300", capB && capB.url.includes(`banners%2F${QA.ana.uid}`) && infoB.width === 1650 && infoB.height === 300, infoB && `${infoB.width}x${infoB.height}`);
    check("aviso de error de la portada", /No se pudo subir la portada/.test(await toastText(page)));
    check("sin errores de JS", page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
    await page.context().close();

    // --- JPEG de respaldo (simula Safari: toBlob sin WebP) ---
    console.log("\n=== respaldo JPEG (sin WebP)");
    page = await login();
    await page.evaluate(() => {
      const orig = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (cb, type, q) {
        return orig.call(this, cb, type === "image/webp" ? "image/png" : type, q);
      };
    });
    await pick(page, "avatar", "t.png", "image/png", await makeImage(page, { width: 800, height: 800, mime: "image/png", transparent: true }));
    await dialog(page).waitFor();
    const capJ = await applyAndCapture(page);
    const infoJ = capJ && await imageInfo(page, capJ.image);
    check("sin WebP sube JPEG", capJ && /image\/jpeg/.test(capJ.meta) && capJ.image[0] === 0xff && capJ.image[1] === 0xd8);
    const [r, g, b] = infoJ ? infoJ.right : [0, 0, 0];
    check("transparencia sobre fondo #0F0F23, no negro", Math.abs(r - 15) <= 4 && Math.abs(g - 15) <= 4 && Math.abs(b - 35) <= 4, `rgb(${r},${g},${b})`);
    await page.context().close();

    // --- celular ---
    console.log("\n=== celular");
    page = await login({ width: 390, height: 844 }, { isMobile: true, hasTouch: true });
    await pick(page, "avatar", "v.jpg", "image/jpeg", vertical);
    await dialog(page).waitFor();
    await page.waitForTimeout(600);
    const box = await dialog(page).boundingBox();
    check("el diálogo ocupa casi todo el ancho", box.width >= 370, `${Math.round(box.width)}x${Math.round(box.height)}`);
    check("los botones se ven sin desplazar", await dialog(page).getByRole("button", { name: "Aplicar" }).isVisible()
      && (await dialog(page).getByRole("button", { name: "Aplicar" }).boundingBox()).y + 40 <= 844);
    await page.screenshot({ path: path.join(SHOTS, "profile-crop-mobile.png") });
    await page.context().close();
  } finally {
    await browser.close();
  }
  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
