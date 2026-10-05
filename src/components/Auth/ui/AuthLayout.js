import { useTranslation } from "react-i18next";
import { LegalLinks } from "../../Legal";
import "../Auth.css";

function Brand({ className }) {
  return (
    <div className={`auth__brand ${className}`}>
      <span className="auth__badge">GM</span>
      <span className="auth__brand-name">GAMERMATCH</span>
    </div>
  );
}

export default function AuthLayout({
  title,
  subtitle,
  tagline,
  compact = false,
  onSubmit,
  onBack,
  backLabel,
  children
}) {
  const { t } = useTranslation("auth");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <div className={`auth${compact ? " auth--compact" : ""}`}>
      <section className="auth__media">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="auth__video"
        >
          <source src="/video/vidControl.mp4" type="video/mp4" />
        </video>
        <div className="auth__media-fade" />

        <Brand className="auth__brand--media" />

        <p className="auth__tagline">{tagline}</p>
      </section>

      <section className="auth__panel">
        <Brand className="auth__brand--panel" />

        {onBack && (
          <button type="button" className="auth__back" onClick={onBack}>
            <i className="pi pi-arrow-left" aria-hidden="true" />
            {backLabel ?? t("keepExploring")}
          </button>
        )}

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <h1 className="auth__title">{title}</h1>
          <p className="auth__subtitle">{subtitle}</p>

          {children}
        </form>

        <LegalLinks className="auth__legal" />

      </section>
    </div>
  );
}
