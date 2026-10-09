import { sanitizeGuideHtml, guideHtmlToText, isSafeImageUrl, MAX_GUIDE_HTML } from "./guideHtml";

// HTML de las guías: se guarda y se muestra sanitizado. Lo que se prueba aquí
// es lo que impide XSS al ver la guía de otra persona.
describe("sanitizeGuideHtml", () => {
  test("conserva el formato permitido del editor", () => {
    const html = "<h2>Título</h2><p><strong>a</strong> <em>b</em> <s>c</s></p><ul><li>uno</li></ul><blockquote>x</blockquote><pre><code>y</code></pre><hr>";
    expect(sanitizeGuideHtml(html)).toBe(html);
  });

  test("quita scripts, iframes, estilos y manejadores de eventos", () => {
    const out = sanitizeGuideHtml(
      '<p onclick="alert(1)" style="color:red">hola</p><script>alert(1)</script><iframe src="https://x"></iframe><svg onload="alert(1)"></svg><style>p{}</style>'
    );
    expect(out).toBe("<p>hola</p>");
  });

  test("quita etiquetas fuera de la lista aunque sean inofensivas (h1, div, span, table)", () => {
    expect(sanitizeGuideHtml("<h1>a</h1><div><span>b</span></div><table><tr><td>c</td></tr></table>")).toBe("abc");
  });

  test("enlaces: solo http(s), siempre en otra pestaña y sin window.opener", () => {
    const out = sanitizeGuideHtml('<a href="https://ign.com/x" target="_self" rel="opener">ok</a>');
    expect(out).toBe('<a href="https://ign.com/x" target="_blank" rel="noopener noreferrer nofollow">ok</a>');
  });

  // URLs maliciosas a propósito: son lo que se comprueba que se quita
  /* eslint-disable no-script-url */
  test.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:x",
    "/ruta-interna",
    "mailto:a@b.com"
  ])("enlace con href %s: se queda el texto sin href", (href) => {
    expect(sanitizeGuideHtml(`<a href="${href}">x</a>`)).toBe("<a>x</a>");
  });
  /* eslint-enable no-script-url */

  test("imágenes: solo https, sin manejadores", () => {
    expect(sanitizeGuideHtml('<img src="https://cdn.x/a.png" alt="a" onerror="alert(1)">')).toBe('<img src="https://cdn.x/a.png" alt="a">');
    expect(sanitizeGuideHtml('<p>a<img src="http://x/a.png">b</p>')).toBe("<p>ab</p>");
    expect(sanitizeGuideHtml('<img src="data:image/png;base64,AAAA">')).toBe("");
    expect(sanitizeGuideHtml('<img src="javascript:alert(1)">')).toBe("");
  });

  test("sin atributos data-* ni class/id", () => {
    expect(sanitizeGuideHtml('<p data-x="1" class="c" id="i">t</p>')).toBe("<p>t</p>");
  });

  test("vacío o null: cadena vacía", () => {
    expect(sanitizeGuideHtml("")).toBe("");
    expect(sanitizeGuideHtml(null)).toBe("");
    expect(sanitizeGuideHtml(undefined)).toBe("");
  });
});

describe("isSafeImageUrl", () => {
  test("https sin espacios ni comillas, hasta 2048 caracteres", () => {
    expect(isSafeImageUrl("https://firebasestorage.googleapis.com/v0/b/x/o/a.png?alt=media")).toBe(true);
    expect(isSafeImageUrl("http://x/a.png")).toBe(false);
    expect(isSafeImageUrl('https://x/a.png" onerror="x')).toBe(false);
    expect(isSafeImageUrl("https://x/ a.png")).toBe(false);
    expect(isSafeImageUrl(`https://x/${"a".repeat(2048)}`)).toBe(false);
    expect(isSafeImageUrl(null)).toBe(false);
  });
});

describe("guideHtmlToText", () => {
  test("texto plano del HTML ya sanitizado", () => {
    expect(guideHtmlToText("<h2>Guía</h2><p>Usa <strong>la Q</strong></p><script>malo()</script>")).toBe("GuíaUsa la Q");
  });

  test("solo imágenes o etiquetas vacías: sin contenido", () => {
    expect(guideHtmlToText('<p><img src="https://x/a.png"></p><p> </p>')).toBe("");
  });
});

test("el límite del HTML es el mismo que firestore.rules (100000)", () => {
  expect(MAX_GUIDE_HTML).toBe(100000);
});
