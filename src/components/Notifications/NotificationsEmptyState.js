import { Button } from "primereact/button";

const STATES = {
  empty: {
    icon: "pi-bell",
    title: "Estás al día",
    text: "Aquí verás solicitudes de amistad, mensajes y la actividad de tus partidas."
  },
  unread: {
    icon: "pi-check-circle",
    title: "No tienes pendientes",
    text: "Ya leíste todas tus notificaciones.",
    action: "Ver todas"
  },
  requests: {
    icon: "pi-user-plus",
    title: "Sin solicitudes pendientes",
    text: "Cuando alguien quiera agregarte como amigo, aparecerá aquí.",
    action: "Ver todas"
  },
  error: {
    icon: "pi-exclamation-triangle",
    title: "No se pudieron cargar tus notificaciones",
    text: "Revisa tu conexión e inténtalo de nuevo.",
    action: "Reintentar"
  }
};

export default function NotificationsEmptyState({ variant, onAction }) {
  const { icon, title, text, action } = STATES[variant];

  return (
    <div className="feed-empty" role={variant === "error" ? "alert" : "status"}>
      <span className="feed-empty__icon">
        <i className={`pi ${icon}`} aria-hidden="true" />
      </span>
      <p className="feed-empty__title">{title}</p>
      <p className="feed-empty__text">{text}</p>
      {action && (
        <Button label={action} className="feed-empty__btn" onClick={onAction} />
      )}
    </div>
  );
}
