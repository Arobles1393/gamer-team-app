import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppFooter } from "../../Layout";
import "../Auth.css";

// Fondo del login. En celular o con "reducir movimiento" solo la imagen: el
// video pesa varios MB y ni siquiera se descarga (auditoría M-17)
const POSTER = "/video/vidControl-poster.jpg";
const STATIC_MEDIA_QUERY = "(max-width: 767px), (prefers-reduced-motion: reduce)";

const matchesStaticMedia = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.(STATIC_MEDIA_QUERY).matches);

const useStaticMedia = () => {
  // Se calcula en el primer render: así el video nunca empieza a bajarse en celular
  const [staticMedia, setStaticMedia] = useState(matchesStaticMedia);

  useEffect(() => {
    const query = window.matchMedia?.(STATIC_MEDIA_QUERY);
    if (!query) return undefined;
    const update = () => setStaticMedia(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return staticMedia;
};

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
  const staticMedia = useStaticMedia();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <div className={`auth${compact ? " auth--compact" : ""}`}>
      <section className="auth__media">
        {staticMedia ? (
          <img src={POSTER} alt="" className="auth__video" />
        ) : (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={POSTER}
            className="auth__video"
          >
            <source src="/video/vidControl.mp4" type="video/mp4" />
          </video>
        )}
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

        <AppFooter className="auth__legal" />

      </section>
    </div>
  );
}
