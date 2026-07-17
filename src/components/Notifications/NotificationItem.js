import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { navigateNotification } from "../../utils";

export default function NotificationItem({
  notification,
  onAccept,
  onReject,
  onMarkAsRead,
  closeOverlay
}) {
  const navigate = useNavigate();

  const status = notification.status;

  const isPendingFriendRequest =
    notification.type === "friend_request" &&
    status === "pending";

  const isAccepted = status === "accepted";

  const isRejected = status === "rejected";

  const handleNotificationClick = async () => {
    if (notification.type === "friend_request") return;

    await onMarkAsRead(notification.id);

    closeOverlay();

    navigateNotification(notification, navigate);
  };

  const handleAccept = (event) => {
    event.stopPropagation();
    onAccept(notification);
  };

  const handleReject = (event) => {
    event.stopPropagation();
    onReject(notification);
  };

  return (
    <div
      className="notification-item"
      onClick={handleNotificationClick}
    >
      <div className="notification-item-content">

        <div className="notification-content">
          <strong>{notification.title}</strong>

          <p className="notification-text">
            {notification.text}
          </p>
        </div>

        {isPendingFriendRequest && (
          <div className="notification-actions">
            <Button
              icon="pi pi-check"
              rounded
              text
              severity="success"
              onClick={handleAccept}
            />

            <Button
              icon="pi pi-times"
              rounded
              text
              severity="danger"
              onClick={handleReject}
            />
          </div>
        )}

        {isAccepted && (
          <span className="notification-status notification-status-success">
            ✅ Aceptada
          </span>
        )}

        {isRejected && (
          <span className="notification-status notification-status-danger">
            ❌ Rechazada
          </span>
        )}

      </div>
    </div>
  );
}