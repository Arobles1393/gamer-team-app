import { useNavigate } from "react-router-dom";
import { Avatar } from "primereact/avatar";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { notificationService } from "../../services/notifications";
import { friendService } from "../../services/friends";
import { useNotifications } from "../../hooks";
import { navigateNotification } from "../../utils";
import "./Notifications.css";

export default function Notifications({ user, userData }) {

  const navigate = useNavigate();

  const { notifications } = useNotifications(user, { limitCount: null });

  const handleMarkAllAsRead = () => {
    return notificationService.markAllNotificationsAsRead(
      user.uid
    );
  };

  const handleAcceptFriendRequest = (notification) => {
    return friendService.acceptFriendRequest(
      notification,
      user,
      userData
    );
  };

  const handleRejectFriendRequest = (notification) => {
    return friendService.rejectFriendRequest(
      notification
    );
  };

  const handleNotificationClick = async (notification) => {

    if (notification.type === "friend_request") {
      return;
    }

    if (!notification.read) {
      await notificationService.markNotificationAsRead(
        notification.id
      );
    }

    navigateNotification(
      notification,
      navigate
    );
  };

  const handleDeleteAllNotifications = () => {
    return notificationService.deleteAllNotifications(
      user.uid
    );
  };

  const confirmDeleteAll = () => {

    confirmDialog({
      message:
        "¿Eliminar todas las notificaciones?",
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      accept: handleDeleteAllNotifications
    });

  };

  return (
    <div className="notifications">
      <h2>Notificaciones</h2>

      {notifications.length === 0 ? (
        <p>No tienes notificaciones</p>
      ) : (
        <>
          <div className="notifications__actions">
            <Button
              label="Marcar todas como leídas"
              icon="pi pi-check"
              outlined
              onClick={handleMarkAllAsRead}
            />

            <Button
              label="Eliminar todas"
              icon="pi pi-trash"
              severity="danger"
              outlined
              onClick={confirmDeleteAll}
            />
          </div>
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`notifications__card ${
                notification.read
                  ? "notifications__card--read"
                  : ""
              }`}
              onClick={() =>
                handleNotificationClick(notification)
              }
            >
              <div className="notifications__content">
                <div className="notifications__sender">
                  <Avatar
                    image={notification.senderAvatar}
                    label={
                      notification.senderName?.charAt(0)
                    }
                    shape="circle"
                  />

                  <div className="notifications__info">
                    <strong className="notifications__title">
                      {notification.title}
                    </strong>

                    <p className="notifications__text">
                      {notification.text}
                    </p>

                    <small className="notifications__date">
                      {formatDate(
                        notification.createdAt
                      )}
                    </small>
                  </div>
                </div>

                {notification.type === "friend_request" &&
                  notification.status === "pending" && (
                  <div className="notifications__notification-actions">
                    <Button
                      label="Aceptar"
                      icon="pi pi-check"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptFriendRequest(notification);
                      }}
                    />

                    <Button
                      label="Rechazar"
                      icon="pi pi-times"
                      severity="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectFriendRequest(notification);
                      }}
                    />
                  </div>
                )}
                {notification.type === "friend_request" &&
                  notification.status === "accepted" && (
                  <span className="notifications__status notifications__status--accepted">
                    ✅ Aceptada
                  </span>
                )}

                {notification.type === "friend_request" &&
                  notification.status === "rejected" && (
                  <span className="notifications__status notifications__status--rejected">
                    ❌ Rechazada
                  </span>
                )}
              </div>

            </Card>

          ))}
        </>
      )}
      <ConfirmDialog />
    </div>
  );
}

function formatDate(timestamp) {

  if (!timestamp?.seconds) return "";

  const diff =
    Date.now() -
    timestamp.seconds * 1000;

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Hace unos segundos";
  }

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `Hace ${days} días`;
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 4) {
    return `Hace ${weeks} semanas`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `Hace ${months} meses`;
  }

  const years = Math.floor(days / 365);

  return `Hace ${years} años`;
}