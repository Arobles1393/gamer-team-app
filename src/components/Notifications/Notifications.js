import { useNavigate } from "react-router-dom";
import { Avatar } from "primereact/avatar";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { notificationService } from "../../services/notifications";
import { friendService } from "../../services/friends";
import { useNotifications, useUserProfile } from "../../hooks";
import { navigateNotification, formatDates, getNotificationText } from "../../utils";
import "./Notifications.css";

function NotificationCard({
  notification,
  onClick,
  onAccept,
  onReject
}) {
  const { userData: sender } = useUserProfile(notification.senderId);

  const { title, text } = getNotificationText(
    notification.type,
    sender?.username || "Alguien"
  );

  return (
    <Card
      className={`notifications__card ${
        notification.read
          ? "notifications__card--read"
          : ""
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="notifications__content">
        <div className="notifications__sender">
          <Avatar
            image={sender?.avatar}
            label={sender?.username?.charAt(0)}
            shape="circle"
          />

          <div className="notifications__info">
            <strong className="notifications__title">
              {title}
            </strong>

            <p className="notifications__text">
              {text}
            </p>

            <small className="notifications__date">
              {formatDates.formatDateN(notification.createdAt)}
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
                onAccept(notification);
              }}
            />

            <Button
              label="Rechazar"
              icon="pi pi-times"
              severity="danger"
              onClick={(e) => {
                e.stopPropagation();
                onReject(notification);
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
  );
}

export default function Notifications({ user }) {

  const navigate = useNavigate();

  const { notifications } = useNotifications(user, { limitCount: null });

  const handleMarkAllAsRead = () => {
    return notificationService.markAllNotificationsAsRead(user.uid);
  };

  const handleAcceptFriendRequest = (notification) => {
    return friendService.acceptFriendRequest(notification, user);
  };

  const handleRejectFriendRequest = (notification) => {
    return friendService.rejectFriendRequest(notification);
  };

  const handleNotificationClick = async (notification) => {

    if (notification.type === "friend_request") {
      return;
    }

    if (!notification.read) {
      await notificationService.markNotificationAsRead(notification.id);
    }

    navigateNotification(notification, navigate);
  };

  const handleDeleteAllNotifications = () => {
    return notificationService.deleteAllNotifications(user.uid);
  };

  const confirmDeleteAll = () => {
    confirmDialog({
      message: "¿Eliminar todas las notificaciones?",
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
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={handleNotificationClick}
              onAccept={handleAcceptFriendRequest}
              onReject={handleRejectFriendRequest}
            />
          ))}
        </>
      )}
      <ConfirmDialog />
    </div>
  );
}