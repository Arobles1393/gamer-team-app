import { memo } from "react";
import ChatAvatar from "./ChatAvatar";
import { formatDates } from "../../utils";

function ChatListItem({ chat, otherUser, currentUserId, active, unread, onSelect }) {
  const username = otherUser?.username || "Usuario";

  const preview = chat.lastMessage
    ? `${chat.lastSenderId === currentUserId ? "Tú: " : ""}${chat.lastMessage}`
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
        aria-label={`Chat con ${username}${unread ? ", mensajes sin leer" : ""}`}
        onClick={() => onSelect({ type: "direct", id: chat.id })}
      >
        <ChatAvatar user={otherUser} />

        <span className="chat-item__body">
          <span className="chat-item__top">
            <span className="chat-item__name">{username}</span>
            <span className="chat-item__time">
              {formatDates.formatChatTime(chat.lastMessageAt)}
            </span>
          </span>

          <span className="chat-item__bottom">
            <span className={`chat-item__preview${chat.lastMessage ? "" : " chat-item__preview--empty"}`}>
              {preview}
            </span>
            {unread && <span className="chat-item__unread" aria-hidden="true" />}
          </span>
        </span>
      </button>
    </li>
  );
}

export default memo(ChatListItem);
