import { Button } from "primereact/button";

/**
 * Estado vacío o de error de una lista: icono, título, texto y, si hay
 * actionLabel, un botón. Los componentes de cada sección (FriendsEmptyState,
 * NotificationsEmptyState...) eligen los textos; este solo los dibuja.
 * - alert: es un error (role="alert" en vez de "status")
 * - plain: sin borde, dentro de los paneles del chat
 */
export default function EmptyState({ icon, title, text, actionLabel, onAction, alert = false, plain = false }) {
  return (
    <div className={`feed-empty${plain ? " feed-empty--plain" : ""}`} role={alert ? "alert" : "status"}>
      <span className="feed-empty__icon">
        <i className={`pi ${icon}`} aria-hidden="true" />
      </span>
      <p className="feed-empty__title">{title}</p>
      {text && <p className="feed-empty__text">{text}</p>}
      {actionLabel && (
        <Button label={actionLabel} className="feed-empty__btn" onClick={onAction} />
      )}
    </div>
  );
}
