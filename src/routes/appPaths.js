// Rutas que existen en la app (AppRoutes y RootRoutes). La guía de
// bienvenida solo muestra pasos de secciones que están aquí: al agregar o
// quitar una sección, actualizar esta lista junto con las rutas.
export const APP_PATHS = [
  "/",
  "/explorar",
  "/post/:id",
  "/profile",
  "/configuracion",
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
  "/terminos",
  "/creditos"
];

export const hasPath = (path) => APP_PATHS.includes(path);

// Donde la guía de bienvenida nunca se abre sola
export const NO_ONBOARDING_PATHS = ["/login", "/recuperar", "/auth/steam/return", "/privacidad", "/terminos", "/creditos"];
export const isOnboardingBlockedPath = (pathname) =>
  NO_ONBOARDING_PATHS.includes(pathname) || pathname.startsWith("/admin");

// Donde no se pide la confirmación de edad: se tienen que poder leer los
// Términos y la Privacidad antes de responder
export const NO_AGE_GATE_PATHS = ["/privacidad", "/terminos", "/creditos"];
export const isAgeGateFreePath = (pathname) => NO_AGE_GATE_PATHS.includes(pathname);
