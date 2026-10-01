import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Botón de icono del rail. Con `to` navega (y marca activo según la ruta);
 * sin `to` actúa como botón normal (p. ej. abrir notificaciones).
 */
export default function RailButton({
  to,
  end = false,
  icon,
  label,
  onClick,
  dot = false,
  badge = 0,
  className = ""
}) {
  const content = (
    <>
      <i className={`pi ${icon}`} aria-hidden="true" />
      {dot && <span className="rail-btn__dot" aria-hidden="true" />}
      {badge > 0 && (
        <span className="rail-btn__badge" aria-hidden="true">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </>
  );

  const { t } = useTranslation();
  const accessibleLabel = badge > 0 ? t("nav.unreadCount", { label, count: badge }) : label;

  if (to) {
    return (
      <NavLink
        to={to}
        end={end}
        title={label}
        aria-label={accessibleLabel}
        className={({ isActive }) => `rail-btn${isActive ? " rail-btn--active" : ""} ${className}`.trim()}
      >
        {content}
      </NavLink>
    );
  }

  return (
    <button
      type="button"
      className={`rail-btn ${className}`.trim()}
      title={label}
      aria-label={accessibleLabel}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
