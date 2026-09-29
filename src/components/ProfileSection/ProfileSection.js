import "./ProfileSection.css";

// Card de sección del perfil (Sobre mí, Juegos, Datos, Redes).
// La usan el perfil propio y el diálogo de perfil de otros jugadores.
export default function ProfileSection({ title, icon, action, className = "", children }) {
  return (
    <section className={`gm-section gm-form ${className}`.trim()}>
      <header className="gm-section__header">
        {icon && (
          <span className="gm-section__icon" aria-hidden="true">
            <i className={`pi ${icon}`} />
          </span>
        )}
        <h2 className="gm-section__title">{title}</h2>
        {action && <div className="gm-section__action">{action}</div>}
      </header>

      {children}
    </section>
  );
}
