import { memo } from "react";
import { formatDates } from "../../utils";

// Fila de un chat de grupo en la lista: icono de grupo y el juego del post
function GroupChatListItem({ group, game, currentUserId, active, unread, onSelect }) {
  const title = game || "Chat del grupo";

  const preview = group.lastMessage
    ? `${group.lastSenderId === currentUserId ? "Tú: " : ""}${group.lastMessage}`
    : "Sin mensajes todavía";

  const className = [
    "chat-item",
    active && "chat-item--active",
    unread && "chat-item--unread"
  ].filter(Boolean).join(" ");

  return (
    <li>
      <button
        type="button"
        className={className}
        aria-current={active ? "true" : undefined}
        aria-label={`Chat del grupo de ${title}${unread ? ", mensajes sin leer" : ""}`}
        onClick={() => onSelect({ type: "group", id: group.id })}
      >
        <span className="chat-item__group-icon" aria-hidden="true">
          <i className="pi pi-users" />
        </span>

        <span className="chat-item__body">
          <span className="chat-item__top">
            <span className="chat-item__name">{title}</span>
            <span className="chat-item__time">
              {formatDates.formatChatTime(group.lastMessageAt)}
            </span>
          </span>

          <span className="chat-item__bottom">
            <span className={`chat-item__preview${group.lastMessage ? "" : " chat-item__preview--empty"}`}>
              {preview}
            </span>
            {unread && <span className="chat-item__unread" aria-hidden="true" />}
          </span>
        </span>
      </button>
    </li>
  );
}

export default memo(GroupChatListItem);
