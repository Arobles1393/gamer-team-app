import { Button } from "primereact/button";

const STATES = {
  noChats: {
    icon: "pi-comments",
    title: "Aún no tienes chats",
    text: () => "Escríbele a uno de tus amigos para empezar a coordinar partidas.",
    action: "Ver amigos"
  },
  noGroupChats: {
    icon: "pi-users",
    title: "Aún no tienes chats de partida",
    text: () => "Marca «Quiero jugar» en una publicación para unirte a su chat de grupo.",
    action: "Ver partidas"
  },
  noMatch: {
    icon: "pi-search",
    title: "Ningún chat coincide",
    text: (search) => `No tienes chats con alguien cuyo usuario contenga "${search}".`,
    action: "Limpiar búsqueda"
  },
  noGroupMatch: {
    icon: "pi-search",
    title: "Ningún chat de partida coincide",
    text: (search) => `No tienes chats de partida de un juego que contenga "${search}".`,
    action: "Limpiar búsqueda"
  },
  error: {
    icon: "pi-exclamation-triangle",
    title: "No se pudieron cargar tus chats",
    text: () => "Revisa tu conexión e inténtalo de nuevo.",
    action: "Reintentar"
  },
  noSelection: {
    icon: "pi-comment",
    title: "Selecciona un chat",
    text: () => "Elige una conversación de la lista para ver los mensajes."
  },
  noMessages: {
    icon: "pi-send",
    title: "Inicia la conversación",
    text: (username) => `Envía el primer mensaje${username ? ` a ${username}` : ""}.`
  }
};

// Variante sin borde: dentro de los paneles del chat
export default function ChatEmptyState({ variant, detail = "", onAction }) {
  const { icon, title, text, action } = STATES[variant];

  return (
    <div className="feed-empty feed-empty--plain" role={variant === "error" ? "alert" : "status"}>
      <span className="feed-empty__icon">
        <i className={`pi ${icon}`} aria-hidden="true" />
      </span>
      <p className="feed-empty__title">{title}</p>
      <p className="feed-empty__text">{text(detail.trim())}</p>
      {action && (
        <Button label={action} className="feed-empty__btn" onClick={onAction} />
      )}
    </div>
  );
}
