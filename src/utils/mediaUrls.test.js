import { allowedMediaUrl, withAllowedPostMedia } from "./mediaUrls";

const STORAGE_URL = "https://firebasestorage.googleapis.com/v0/b/gamerteam-4ed20.firebasestorage.app/o/avatars%2Fuid%2Fa.jpg?alt=media&token=abc-123";

describe("allowedMediaUrl", () => {
  test("Storage del proyecto (los dos nombres de bucket)", () => {
    expect(allowedMediaUrl("storage", STORAGE_URL)).toBe(STORAGE_URL);
    const appspot = STORAGE_URL.replace("firebasestorage.app", "appspot.com");
    expect(allowedMediaUrl("storage", appspot)).toBe(appspot);
  });

  test("Storage de otro proyecto u otro dominio: null", () => {
    expect(allowedMediaUrl("storage", STORAGE_URL.replace("gamerteam-4ed20", "otro-proyecto"))).toBeNull();
    expect(allowedMediaUrl("storage", "https://tracker.example.com/pixel.gif")).toBeNull();
    expect(allowedMediaUrl("storage", "https://firebasestorage.googleapis.com.evil.com/v0/b/gamerteam-4ed20.appspot.com/o/x")).toBeNull();
  });

  test("avatar: Storage, Google y Steam (todos los que existen en producción)", () => {
    expect(allowedMediaUrl("avatar", STORAGE_URL)).toBe(STORAGE_URL);
    expect(allowedMediaUrl("avatar", "https://lh3.googleusercontent.com/a/ACg8ocK-x_Y=s96-c")).not.toBeNull();
    expect(allowedMediaUrl("avatar", "https://avatars.steamstatic.com/abc_full.jpg")).not.toBeNull();
    expect(allowedMediaUrl("avatar", "https://avatars.akamai.steamstatic.com/abc_full.jpg")).not.toBeNull();
    expect(allowedMediaUrl("avatar", "https://evil.com/steamstatic.com/a.jpg")).toBeNull();
  });

  test("partidas: RAWG y SteamGridDB", () => {
    expect(allowedMediaUrl("rawg", "https://media.rawg.io/media/games/a/b.jpg")).not.toBeNull();
    expect(allowedMediaUrl("steamgrid", "https://cdn2.steamgriddb.com/logo/x.png")).not.toBeNull();
    expect(allowedMediaUrl("steamgrid", "https://media.rawg.io/x.png")).toBeNull();
  });

  test("sin http, con comillas, espacios o paréntesis (CSS url()), o demasiado larga: null", () => {
    expect(allowedMediaUrl("rawg", "http://media.rawg.io/a.jpg")).toBeNull();
    expect(allowedMediaUrl("storage", `${STORAGE_URL}")`)).toBeNull();
    expect(allowedMediaUrl("storage", `${STORAGE_URL}), url(https://evil.com/x`)).toBeNull();
    expect(allowedMediaUrl("rawg", "https://media.rawg.io/a b.jpg")).toBeNull();
    expect(allowedMediaUrl("rawg", `https://media.rawg.io/${"a".repeat(2048)}`)).toBeNull();
    expect(allowedMediaUrl("rawg", null)).toBeNull();
    expect(allowedMediaUrl("desconocido", "https://media.rawg.io/a.jpg")).toBeNull();
  });
});

test("withAllowedPostMedia: solo cambia las imágenes de otro origen", () => {
  const data = {
    game: "Valorant",
    image: "https://media.rawg.io/a.jpg",
    logo: "https://otro.com/logo.png",
    portada: "https://cdn2.steamgriddb.com/grid/p.png",
    clip: null
  };
  expect(withAllowedPostMedia(data)).toEqual({ ...data, logo: null });
});
