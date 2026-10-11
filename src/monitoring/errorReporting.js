import * as Sentry from "@sentry/react";

// Reporte de errores con Sentry (auditoría M-18). Se activa al poner el DSN
// del proyecto de Sentry en REACT_APP_SENTRY_DSN y solo en el build de
// producción: sin DSN, o con `npm start`, no se envía nada.
//
// Sin datos personales: no se envían usuario, IP, cookies ni cabeceras, ni
// lo que la app escribe en la consola (puede incluir datos de las personas).
// Solo el error, su pila, la página (sin query ni hash) y el navegador.

const DSN = process.env.REACT_APP_SENTRY_DSN;
const ENABLED = Boolean(DSN) && process.env.NODE_ENV === "production";

// /post/abc?x=1#y -> /post/abc
const stripUrl = (url) => (typeof url === "string" ? url.split(/[?#]/)[0] : url);

export const scrubEvent = (event) => {
  delete event.user;
  delete event.server_name;
  if (event.request) {
    event.request = { url: stripUrl(event.request.url) };
  }
  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs
      .filter((crumb) => crumb.category !== "console")
      .map((crumb) => (crumb.data?.url || crumb.data?.to || crumb.data?.from
        ? {
          ...crumb,
          data: {
            ...crumb.data,
            ...(crumb.data.url && { url: stripUrl(crumb.data.url) }),
            ...(crumb.data.to && { to: stripUrl(crumb.data.to) }),
            ...(crumb.data.from && { from: stripUrl(crumb.data.from) })
          }
        }
        : crumb));
  }
  return event;
};

export const initErrorReporting = () => {
  if (!ENABLED) return;

  Sentry.init({
    dsn: DSN,
    environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || "production",
    sendDefaultPii: false,
    // Solo errores: sin trazas de rendimiento ni grabación de sesiones
    tracesSampleRate: 0,
    integrations: (defaults) =>
      defaults.map((integration) =>
        integration.name === "Breadcrumbs"
          ? Sentry.breadcrumbsIntegration({ console: false, dom: false })
          : integration
      ),
    beforeSend: scrubEvent,
    beforeSendTransaction: () => null
  });
};

// Errores que la app atrapa y quiere reportar (p. ej. el ErrorBoundary)
export const reportError = (error, context = {}) => {
  if (!ENABLED) return;
  Sentry.captureException(error, { extra: context });
};
