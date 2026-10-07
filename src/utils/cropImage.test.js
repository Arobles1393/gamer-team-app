import { MAX_ORIGINAL_BYTES, isTooLarge, validatePickedFile } from "./cropImage";

// getCroppedBlob usa canvas, que no existe en jsdom: se prueba a mano
const fakeFile = (type, size = 1000) => ({ type, size });

describe("validatePickedFile", () => {
  test.each(["image/png", "image/jpeg", "image/webp", "image/gif"])("acepta %s", (type) => {
    expect(validatePickedFile(fakeFile(type))).toBeNull();
  });

  test("rechaza SVG aunque sea imagen", () => {
    expect(validatePickedFile(fakeFile("image/svg+xml"))).toBe("type");
  });

  test.each(["application/pdf", "image/bmp", "image/heic", "text/html", ""])("rechaza %s", (type) => {
    expect(validatePickedFile(fakeFile(type))).toBe("type");
  });

  test("acepta justo 10 MB y rechaza más", () => {
    expect(validatePickedFile(fakeFile("image/png", MAX_ORIGINAL_BYTES))).toBeNull();
    expect(validatePickedFile(fakeFile("image/png", MAX_ORIGINAL_BYTES + 1))).toBe("size");
  });

  test("sin archivo", () => {
    expect(validatePickedFile(null)).toBe("missing");
    expect(validatePickedFile(undefined)).toBe("missing");
  });
});

describe("isTooLarge", () => {
  test("hasta 40 megapíxeles pasa", () => {
    expect(isTooLarge(1920, 1080)).toBe(false);
    expect(isTooLarge(8000, 5000)).toBe(false); // justo 40 MP
  });

  test("más de 40 megapíxeles se rechaza", () => {
    expect(isTooLarge(8000, 5001)).toBe(true);
    expect(isTooLarge(20000, 20000)).toBe(true);
  });

  test("dimensiones inválidas se rechazan", () => {
    expect(isTooLarge(NaN, 100)).toBe(true);
    expect(isTooLarge(100, Infinity)).toBe(true);
    expect(isTooLarge(undefined, undefined)).toBe(true);
  });
});
