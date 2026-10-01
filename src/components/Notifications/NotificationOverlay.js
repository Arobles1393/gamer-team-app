import { useState } from "react";
import { useTranslation } from "react-i18next";
import { OverlayPanel } from "primereact/overlaypanel";
import { useNavigate } from "react-router-dom";
import NotificationItem from "./NotificationItem";
import NotificationItemSkeleton from "./NotificationItemSkeleton";
import { navigateNotification } from "../../utils";
import "./Notifications.css";

// Panel de la campana del rail: las 10 más recientes
export default function NotificationOverlay({
  notificationRef,
  notifications,
  loading,
  unreadCount,
  onAccept,
  onReject,
  onMarkAsRead,
  onMarkAllAsRead
}) {
  const { t } = useTranslation("notifications");
  const navigate = useNavigate();
  const [markingAll, setMarkingAll] = useState(false);

  const notificationsList = notifications ?? [];

  const handleCloseOverlay = () => {
    notificationRef.current?.hide();
  };

  const handleOpenNotification = (notification) => {
    handleCloseOverlay();

    if (!notification.read) {
      onMarkAsRead(notification.id).catch((error) => {
        console.error("Error marcando la notificación como leída:", error);
      });
    }

    navigateNotification(notification, navigate);
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);

    try {
      await onMarkAllAsRead();
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleViewAllNotifications = () => {
    handleCloseOverlay();
    navigate("/notifications");
  };

  const renderBody = () => {
    if (loading) {
      return (
        <ul className="notif-list" aria-busy="true" aria-label={t("loading")}>
          {Array.from({ length: 3 }, (_, i) => <NotificationItemSkeleton key={i} compact />)}
        </ul>
      );
    }

    if (notificationsList.length === 0) {
      return (
        <div className="notif-panel__empty" role="status">
          <span className="notif-panel__empty-icon">
            <i className="pi pi-bell" aria-hidden="true" />
          </span>
          <p className="notif-panel__empty-title">{t("overlayEmpty.title")}</p>
          <p className="notif-panel__empty-text">{t("overlayEmpty.text")}</p>
        </div>
      );
    }

    return (
      <ul className="notif-list">
        {notificationsList.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            compact
            onOpen={handleOpenNotification}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </ul>
    );
  };

  return (
    <OverlayPanel
      ref={notificationRef}
      className="gm-notif-overlay"
      aria-label={t("title")}
    >
      <header className="notif-panel__header">
        <span className="notif-panel__title">{t("title")}</span>
        {unreadCount > 0 && (
          <span className="notif-panel__count" aria-label={t("unreadCount", { count: unreadCount })}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <button
          type="button"
          className="notif-panel__link"
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0 || markingAll}
        >
          {t("markAllRead")}
        </button>
      </header>

      <div className="notif-panel__body">
        {renderBody()}
      </div>

      <button
        type="button"
        className="notif-panel__footer"
        onClick={handleViewAllNotifications}
      >
        {t("viewAll")}
        <i className="pi pi-arrow-right" aria-hidden="true" />
      </button>
    </OverlayPanel>
  );
}
