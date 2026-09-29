import { useState } from "react";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { useUserProfile } from "../../hooks";
import { formatDates, getNotificationMeta } from "../../utils";

const STATUS = {
  accepted: { label: "Aceptada", icon: "pi-check" },
  rejected: { label: "Rechazada", icon: "pi-times" }
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
  onReject
}) {
  const { userData: sender } = useUserProfile(notification.senderId);
  const [responding, setResponding] = useState(null);

  const { icon, action } = getNotificationMeta(notification.type);
  const username = sender?.username || "Alguien";
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
        <Avatar
          image={sender?.avatar}
          label={sender?.avatar ? undefined : username.charAt(0).toUpperCase()}
          shape="circle"
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
          <span className="notif__sr">(sin leer)</span>
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
            label="Aceptar"
            className="notif__btn notif__btn--primary"
            loading={responding === "accept"}
            disabled={Boolean(responding)}
            onClick={() => respond("accept", onAccept)}
          />
          <Button
            label="Rechazar"
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
          {status.label}
        </span>
      )}
    </li>
  );
}
