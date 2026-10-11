import { CONTACT_EMAIL, CONTACT_MAILTO } from "./contact";

describe("CONTACT_EMAIL", () => {
  it("tiene formato de correo válido", () => {
    expect(CONTACT_EMAIL).toMatch(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/);
  });

  it("no contiene espacios", () => {
    expect(CONTACT_EMAIL).not.toMatch(/\s/);
  });

  it("el enlace es mailto: con esa dirección", () => {
    expect(CONTACT_MAILTO).toBe(`mailto:${CONTACT_EMAIL}`);
  });
});
