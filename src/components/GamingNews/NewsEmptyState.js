import { Button } from "primereact/button";

const STATES = {
  empty: {
    icon: "pi-megaphone",
    title: "Aún no hay noticias",
    text: () => "Las noticias de IGN y GameSpot se sincronizan periódicamente. Vuelve más tarde."
  },
  noMatch: {
    icon: "pi-search",
    title: "Ninguna noticia coincide",
    text: (search) => `No encontramos noticias sobre "${search}".`,
    action: "Limpiar búsqueda"
  },
  error: {
    icon: "pi-exclamation-triangle",
    title: "No se pudieron cargar las noticias",
    text: () => "Revisa tu conexión e inténtalo de nuevo.",
    action: "Reintentar"
  }
};

export default function NewsEmptyState({ variant, search = "", onAction }) {
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
