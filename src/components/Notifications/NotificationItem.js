import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "../UserAvatar";
import { Button } from "primereact/button";
import { usePostSummary, useUserProfile } from "../../hooks";
import { formatDates, getNotificationMeta } from "../../utils";

const STATUS = {
  accepted: { labelKey: "status.accepted", icon: "pi-check" },
  rejected: { labelKey: "status.rejected", icon: "pi-times" }
};

/**
 * Notificación de la página y del overlay (`compact`).
 * Las solicitudes de amistad no navegan: se responden con Aceptar / Rechazar.
 */
export default function NotificationItem({
  notification,
  compact = false,
  onOpen,
  onAccept,
  onReject,
  onError
}) {
  const { t } = useTranslation("notifications");
  const { userData: sender } = useUserProfile(notification.senderId);
  const [responding, setResponding] = useState(null);

  const isGroupMessage = notification.type === "group_message";
  // El juego del post se lee en vivo (no se copia en la notificación)
  const post = usePostSummary(isGroupMessage ? notification.relatedId : null);

  const { icon, actionKey } = getNotificationMeta(notification.type);
  const action = isGroupMessage && post?.game
    ? t("actions.group_message_game", { game: post.game })
    : t(actionKey);
  const username = sender?.username || t("someone");
  const unread = !notification.read;

  const isFriendRequest = notification.type === "friend_request";
  const isPending = isFriendRequest && notification.status === "pending";
  const status = isFriendRequest ? STATUS[notification.status] : null;

  const respond = async (kind, handler) => {
    setResponding(kind);

    try {
      await handler(notification);
    } catch (error) {
      console.error("Error respondiendo la solicitud de amistad:", error);
      onError?.(t("errors.respond"));
    } finally {
      setResponding(null);
    }
  };

  const className = [
    "notif",
    compact && "notif--compact",
    unread && "notif--unread",
    !isFriendRequest && "notif--clickable"
  ].filter(Boolean).join(" ");

  const content = (
    <>
      <span className="notif__avatar">
        <UserAvatar
          image={sender?.avatar}
          username={username}
          className="notif__avatar-img"
        />
        <span className={`notif__badge notif__badge--${notification.type}`} aria-hidden="true">
          <i className={`pi ${icon}`} />
        </span>
      </span>

      <span className="notif__body">
        <span className="notif__text">
          <strong className="notif__user">{username}</strong> {action}
        </span>
        <span className="notif__time">
          {formatDates.formatDateN(notification.createdAt)}
        </span>
      </span>

      {unread && (
        <>
          <span className="notif__dot" aria-hidden="true" />
          <span className="notif__sr">{t("unreadSr")}</span>
        </>
      )}
    </>
  );

  return (
    <li className={className}>
      {isFriendRequest ? (
        <div className="notif__main">{content}</div>
      ) : (
        <button type="button" className="notif__main" onClick={() => onOpen(notification)}>
          {content}
        </button>
      )}

      {isPending && (
        <div className="notif__actions">
          <Button
            label={t("accept")}
            className="notif__btn notif__btn--primary"
            loading={responding === "accept"}
            disabled={Boolean(responding)}
            onClick={() => respond("accept", onAccept)}
          />
          <Button
            label={t("reject")}
            className="notif__btn notif__btn--ghost"
            loading={responding === "reject"}
            disabled={Boolean(responding)}
            onClick={() => respond("reject", onReject)}
          />
        </div>
      )}

      {status && (
        <span className={`notif__status notif__status--${notification.status}`}>
          <i className={`pi ${status.icon}`} aria-hidden="true" />
          {t(status.labelKey)}
        </span>
      )}
    </li>
  );
}
