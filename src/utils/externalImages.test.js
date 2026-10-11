import { imageHost, isTrustedImageUrl, markExternalImages } from "./externalImages";
import { sanitizeGuideHtml } from "./guideHtml";

const STORAGE_URL = "https://firebasestorage.googleapis.com/v0/b/gamerteam-4ed20.firebasestorage.app/o/guides%2Fu1%2Fa.png?alt=media";
const label = (host) => `Mostrar imagen de ${host}`;

describe("isTrustedImageUrl", () => {
  it("nuestro Storage y los sitios que la app ya usa: sí", () => {
    expect(isTrustedImageUrl(STORAGE_URL)).toBe(true);
    expect(isTrustedImageUrl("https://media.rawg.io/media/games/a.jpg")).toBe(true);
    expect(isTrustedImageUrl("https://cdn2.steamgriddb.com/logo/a.png")).toBe(true);
    expect(isTrustedImageUrl("https://cdn.cloudflare.steamstatic.com/steam/apps/1/header.jpg")).toBe(true);
    expect(isTrustedImageUrl("https://lh3.googleusercontent.com/a/abc")).toBe(true);
  });

  it("cualquier otro sitio, http o algo raro: no", () => {
    expect(isTrustedImageUrl("https://tracker.example.com/pixel.png")).toBe(false);
    expect(isTrustedImageUrl("https://media.rawg.io.evil.com/a.jpg")).toBe(false);
    expect(isTrustedImageUrl("http://media.rawg.io/media/a.jpg")).toBe(false);
    expect(isTrustedImageUrl("https://firebasestorage.googleapis.com/v0/b/otro-proyecto.appspot.com/o/a.png")).toBe(false);
    expect(isTrustedImageUrl(null)).toBe(false);
  });
});

describe("imageHost", () => {
  it("el sitio sin www.", () => {
    expect(imageHost("https://www.example.com/a.png")).toBe("example.com");
    expect(imageHost("no es url")).toBe("");
  });
});

describe("markExternalImages", () => {
  const html = sanitizeGuideHtml(
    `<p>Hola</p><img src="https://tracker.example.com/a.png" alt="x"><img src="${STORAGE_URL}"><img src="https://otro.net/b.png">`
  );

  it("cambia las externas por un botón con su sitio y deja las de confianza", () => {
    const doc = new DOMParser().parseFromString(markExternalImages(html, { label }), "text/html");
    const imgs = [...doc.querySelectorAll("img")];
    const buttons = [...doc.querySelectorAll("button.guide-external-image")];
    expect(imgs.map((img) => img.getAttribute("src"))).toEqual([STORAGE_URL]);
    expect(buttons.map((b) => [b.dataset.index, b.textContent])).toEqual([
      ["0", "Mostrar imagen de tracker.example.com"],
      ["2", "Mostrar imagen de otro.net"]
    ]);
    expect(buttons[0].getAttribute("type")).toBe("button");
  });

  it("las ya mostradas (revealed) vuelven como imagen, sin referrer", () => {
    const doc = new DOMParser().parseFromString(markExternalImages(html, { label, revealed: new Set([2]) }), "text/html");
    const srcs = [...doc.querySelectorAll("img")].map((img) => img.getAttribute("src"));
    expect(srcs).toEqual([STORAGE_URL, "https://otro.net/b.png"]);
    expect(doc.querySelector("img").getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(doc.querySelectorAll("button.guide-external-image")).toHaveLength(1);
  });

  it("el texto del botón no se interpreta como HTML", () => {
    const out = markExternalImages(html, { label: () => "<img src=x onerror=alert(1)>" });
    const doc = new DOMParser().parseFromString(out, "text/html");
    expect(doc.querySelectorAll("img")).toHaveLength(1);
  });
});
