import { hasPath } from "../routes/appPaths";

// Versión de la guía: si cambia mucho, se puede volver a mostrar a quien
// completó una versión anterior (onboarding.completedVersion)
export const ONBOARDING_VERSION = 1;

// Pasos de la guía de bienvenida (textos en locales/{idioma}/onboarding.json).
// isAvailable: la sección existe de verdad en la app; si no, el paso se omite.
// Iconos de PrimeIcons, la librería de iconos del proyecto.
export const ONBOARDING_STEPS = [
  { id: "welcome", icon: "pi-bolt", titleKey: "steps.welcome.title", bodyKey: "steps.welcome.body", isAvailable: () => true },
  { id: "feed", icon: "pi-home", titleKey: "steps.feed.title", bodyKey: "steps.feed.body", isAvailable: () => hasPath("/") && hasPath("/explorar") },
  { id: "publish", icon: "pi-plus-circle", titleKey: "steps.publish.title", bodyKey: "steps.publish.body", isAvailable: () => hasPath("/") },
  { id: "players", icon: "pi-search", titleKey: "steps.players.title", bodyKey: "steps.players.body", isAvailable: () => hasPath("/findPlayers") },
  { id: "friends", icon: "pi-users", titleKey: "steps.friends.title", bodyKey: "steps.friends.body", isAvailable: () => hasPath("/friends") },
  { id: "chats", icon: "pi-comments", titleKey: "steps.chats.title", bodyKey: "steps.chats.body", isAvailable: () => hasPath("/chat") },
  { id: "notifications", icon: "pi-bell", titleKey: "steps.notifications.title", bodyKey: "steps.notifications.body", isAvailable: () => hasPath("/notifications") },
  { id: "profile", icon: "pi-user", titleKey: "steps.profile.title", bodyKey: "steps.profile.body", isAvailable: () => hasPath("/profile") },
  // El texto nombra las tres secciones: se muestra solo si existen todas
  { id: "discover", icon: "pi-compass", titleKey: "steps.discover.title", bodyKey: "steps.discover.body", isAvailable: () => hasPath("/news") && hasPath("/guias") && hasPath("/comunidad") },
  { id: "safety", icon: "pi-shield", titleKey: "steps.safety.title", bodyKey: "steps.safety.body", isAvailable: () => hasPath("/profile") },
  { id: "closing", icon: "pi-question-circle", titleKey: "steps.closing.title", bodyKey: "steps.closing.body", isAvailable: () => true }
];

export const getAvailableSteps = () => ONBOARDING_STEPS.filter((step) => step.isAvailable());
