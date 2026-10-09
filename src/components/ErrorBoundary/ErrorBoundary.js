import { Component } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { reportError } from "../../monitoring/errorReporting";
import "../NotFound/NotFound.css";

// Pantalla cuando una página falla al dibujarse. Sin router (el error puede
// venir de fuera): recargar y volver al inicio son navegaciones completas.
function ErrorFallback() {
  const { t } = useTranslation();

  return (
    <section className="not-found" role="alert" aria-labelledby="error-boundary-title">
      <div className="not-found__card">
        <span className="not-found__eyebrow">{t("errorBoundary.eyebrow")}</span>
        <h1 id="error-boundary-title" className="not-found__title">
          {t("errorBoundary.title")}
        </h1>
        <p className="not-found__text">{t("errorBoundary.text")}</p>
        <div className="not-found__actions">
          <Button
            label={t("errorBoundary.reload")}
            icon="pi pi-refresh"
            className="gm-btn gm-btn--primary"
            onClick={() => window.location.reload()}
          />
          <Button
            label={t("errorBoundary.home")}
            icon="pi pi-home"
            className="gm-btn gm-btn--ghost"
            onClick={() => window.location.assign("/")}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Si algo dentro falla al dibujarse, muestra ErrorFallback en lugar de
 * dejar la pantalla en blanco (auditoría M-14). resetKey (p. ej. la ruta):
 * al cambiar, vuelve a intentar dibujar el contenido.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error al dibujar la pantalla:", error, info?.componentStack);
    // A Sentry, si está activo (auditoría M-18)
    reportError(error, { componentStack: info?.componentStack });
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    return this.state.error ? <ErrorFallback /> : this.props.children;
  }
}
