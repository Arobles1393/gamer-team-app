// Rutas que existen en la app (AppRoutes y RootRoutes). La guía de
// bienvenida solo muestra pasos de secciones que están aquí: al agregar o
// quitar una sección, actualizar esta lista junto con las rutas.
export const APP_PATHS = [
  "/",
  "/explorar",
  "/post/:id",
  "/profile",
  "/myposts",
  "/myparties",
  "/chat",
  "/notifications",
  "/friends",
  "/findPlayers",
  "/news",
  "/comunidad",
  "/guias",
  "/privacidad",
  "/terminos"
];

export const hasPath = (path) => APP_PATHS.includes(path);

// Donde la guía de bienvenida nunca se abre sola
export const NO_ONBOARDING_PATHS = ["/login", "/recuperar", "/auth/steam/return", "/privacidad", "/terminos"];
export const isOnboardingBlockedPath = (pathname) =>
  NO_ONBOARDING_PATHS.includes(pathname) || pathname.startsWith("/admin");
