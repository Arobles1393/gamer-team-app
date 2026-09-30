import { Button } from "primereact/button";

const STATES = {
  idle: {
    icon: "pi-users",
    title: "Encuentra a tu próximo squad",
    text: () => "Escribe el nombre de usuario de un jugador para empezar."
  },
  empty: {
    icon: "pi-search",
    title: "Ningún jugador coincide",
    text: (search) => `No encontramos a nadie cuyo usuario empiece por "${search}".`,
    action: "Limpiar búsqueda"
  },
  error: {
    icon: "pi-exclamation-triangle",
    title: "No se pudieron cargar los jugadores",
    text: () => "Revisa tu conexión e inténtalo de nuevo.",
    action: "Reintentar"
  }
};

export default function PlayersEmptyState({ variant, search, onAction }) {
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
