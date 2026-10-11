import { getSupportUrl, parseSupportUrl } from "./supportUrl";

describe("parseSupportUrl", () => {
  test.each([
    ["vacía", ""],
    ["solo espacios", "   "],
    ["sin valor", undefined],
    ["http", "http://ko-fi.com/usuario"],
    ["subdominio engañoso", "https://ko-fi.com.evil.com/usuario"],
    ["ruta engañosa", "https://evil.com/ko-fi.com"],
    ["sin protocolo", "evil.com/ko-fi.com"],
    ["malformada", "https://"],
    ["otro subdominio de ko-fi", "https://www.ko-fi.com/usuario"],
    ["con usuario en la URL", "https://alguien@ko-fi.com/usuario"],
    ["esquema de script", ["javascript", "alert(1)"].join(":")]
  ])("%s -> null", (_, value) => {
    expect(parseSupportUrl(value)).toBeNull();
  });

  test("https://ko-fi.com/usuario es válida", () => {
    expect(parseSupportUrl("https://ko-fi.com/usuario")).toBe("https://ko-fi.com/usuario");
    expect(parseSupportUrl("  https://ko-fi.com/usuario  ")).toBe("https://ko-fi.com/usuario");
  });
});

describe("getSupportUrl", () => {
  const original = process.env.REACT_APP_SUPPORT_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.REACT_APP_SUPPORT_URL;
    else process.env.REACT_APP_SUPPORT_URL = original;
  });

  test("lee REACT_APP_SUPPORT_URL", () => {
    process.env.REACT_APP_SUPPORT_URL = "https://ko-fi.com/usuario";
    expect(getSupportUrl()).toBe("https://ko-fi.com/usuario");
    process.env.REACT_APP_SUPPORT_URL = "https://ko-fi.com.evil.com/usuario";
    expect(getSupportUrl()).toBeNull();
    delete process.env.REACT_APP_SUPPORT_URL;
    expect(getSupportUrl()).toBeNull();
  });
});
