import { scrubEvent } from "./errorReporting";

describe("scrubEvent (sin datos personales en los reportes)", () => {
  test("quita usuario, servidor, cabeceras, cookies y query de la página", () => {
    const event = scrubEvent({
      user: { id: "uid123", email: "a@b.com", ip_address: "1.2.3.4" },
      server_name: "pc-de-alguien",
      request: {
        url: "https://gamermatch.app/post/abc?token=secreto#x",
        headers: { "User-Agent": "Edge", Cookie: "s=1" },
        cookies: { s: "1" },
        query_string: "token=secreto"
      },
      exception: { values: [{ type: "TypeError" }] }
    });
    expect(event.user).toBeUndefined();
    expect(event.server_name).toBeUndefined();
    expect(event.request).toEqual({ url: "https://gamermatch.app/post/abc" });
    expect(event.exception.values[0].type).toBe("TypeError");
  });

  test("quita lo que la app escribió en la consola y limpia URLs de navegación y red", () => {
    const event = scrubEvent({
      breadcrumbs: [
        { category: "console", message: "Error con correo a@b.com" },
        { category: "navigation", data: { from: "/perfil?x=1", to: "/post/1#c" } },
        { category: "fetch", data: { url: "https://api.x/y?key=abc", status_code: 500 } },
        { category: "ui.click", message: "button" }
      ]
    });
    expect(event.breadcrumbs).toEqual([
      { category: "navigation", data: { from: "/perfil", to: "/post/1" } },
      { category: "fetch", data: { url: "https://api.x/y", status_code: 500 } },
      { category: "ui.click", message: "button" }
    ]);
  });

  test("un evento sin request ni breadcrumbs pasa igual", () => {
    expect(scrubEvent({ message: "x" })).toEqual({ message: "x" });
  });
});
