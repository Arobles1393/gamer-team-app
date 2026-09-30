import { Button } from "primereact/button";

const STATES = {
  empty: {
    icon: "pi-user-plus",
    title: "Aún no tienes amigos",
    text: () => "Busca jugadores y envíales una solicitud para armar tu squad.",
    action: "Buscar jugadores"
  },
  noMatch: {
    icon: "pi-search",
    title: "Ningún amigo coincide",
    text: (search) => `Ninguno de tus amigos tiene un usuario que contenga "${search}".`,
    action: "Limpiar búsqueda"
  },
  offline: {
    icon: "pi-moon",
    title: "Nadie está en línea",
    text: () => "Ninguno de tus amigos está conectado ahora mismo.",
    action: "Ver todos"
  },
  error: {
    icon: "pi-exclamation-triangle",
    title: "No se pudieron cargar tus amigos",
    text: () => "Revisa tu conexión e inténtalo de nuevo.",
    action: "Reintentar"
  }
};

export default function FriendsEmptyState({ variant, search, onAction }) {
  const { icon, title, text, action } = STATES[variant];

  return (
    <div className="feed-empty" role={variant === "error" ? "alert" : "status"}>
      <span className="feed-empty__icon">
        <i className={`pi ${icon}`} aria-hidden="true" />
      </span>
      <p className="feed-empty__title">{title}</p>
      <p className="feed-empty__text">{text(search.trim())}</p>
      {action && (
        <Button label={action} className="feed-empty__btn" onClick={onAction} />
      )}
    </div>
  );
}
