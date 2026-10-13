import { memo } from "react";
import { useTranslation } from "react-i18next";
import { formatDates } from "../../utils";
import GameThumb from "./GameThumb";

// Fila de un chat de grupo en la lista: la portada y el juego del post
function GroupChatListItem({ group, post, currentUserId, active, unread, onSelect }) {
  const { t } = useTranslation("chat");
  const title = post?.game || t("list.groupFallback");

  const preview = group.lastMessage
    ? (group.lastSenderId === currentUserId ? t("list.you", { message: group.lastMessage }) : group.lastMessage)
    : t("list.noMessages");

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
        aria-label={t(unread ? "list.groupItemLabelUnread" : "list.groupItemLabel", { title })}
        onClick={() => onSelect({ type: "group", id: group.id })}
      >
        <GameThumb postId={group.id} post={post} title={title} />

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
