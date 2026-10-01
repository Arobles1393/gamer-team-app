import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import NotificationItem from "./NotificationItem";
import NotificationItemSkeleton from "./NotificationItemSkeleton";
import NotificationsHeader from "./NotificationsHeader";
import NotificationsFilters from "./NotificationsFilters";
import NotificationsEmptyState from "./NotificationsEmptyState";
import { notificationService } from "../../services/notifications";
import { friendService } from "../../services/friends";
import { useNotifications } from "../../hooks";
import { navigateNotification, formatDates, confirmDestructive } from "../../utils";
import { useCurrentUser } from "../../context";
import "../Posts/Feed.css";
import "./Notifications.css";

const DAY_MS = 24 * 60 * 60 * 1000;

const isPendingRequest = (notification) =>
  notification.type === "friend_request" && notification.status === "pending";

const FILTER_FNS = {
  all: () => true,
  unread: (notification) => !notification.read,
  requests: isPendingRequest
};

// Clave de notifications:sections.* según la fecha
const getSectionKey = (timestamp) => {
  const date = formatDates.toDate(timestamp);
  if (!date) return "older";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const diff = startOfToday - date;

  if (diff <= 0) return "today";
  if (diff <= DAY_MS) return "yesterday";
  if (diff <= 6 * DAY_MS) return "thisWeek";
  return "older";
};

// Vienen ordenadas por fecha desc: basta con cortar cuando cambia la sección
const groupBySection = (notifications) =>
  notifications.reduce((sections, notification) => {
    const key = getSectionKey(notification.createdAt);
    const last = sections[sections.length - 1];

    if (last?.key === key) {
      last.items.push(notification);
    } else {
      sections.push({ key, items: [notification] });
    }

    return sections;
  }, []);

export default function Notifications() {
  const { t } = useTranslation("notifications");
  const user = useCurrentUser();
  const navigate = useNavigate();
  const toast = useRef(null);
  const [filter, setFilter] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);

  const { notifications, loading, error, retry } = useNotifications(user, { limitCount: null });

  const counts = useMemo(() => ({
    all: notifications.length,
    unread: notifications.filter(FILTER_FNS.unread).length,
    requests: notifications.filter(FILTER_FNS.requests).length
  }), [notifications]);

  const sections = useMemo(
    () => groupBySection(notifications.filter(FILTER_FNS[filter])),
    [notifications, filter]
  );

  const showError = useCallback((detail) => {
    toast.current?.show({
      severity: "error",
      summary: t("common:status.error"),
      detail,
      life: 3000
    });
  }, [t]);

  const handleOpenNotification = useCallback((notification) => {
    if (!notification.read) {
      notificationService.markNotificationAsRead(notification.id).catch((error) => {
        console.error("Error marcando la notificación como leída:", error);
      });
    }

    navigateNotification(notification, navigate);
  }, [navigate]);

  const handleAcceptFriendRequest = useCallback((notification) => {
    return friendService.acceptFriendRequest(notification, user);
  }, [user]);

  const handleRejectFriendRequest = useCallback((notification) => {
    return friendService.rejectFriendRequest(notification);
  }, []);

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);

    try {
      await notificationService.markAllNotificationsAsRead(user.uid);
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
      showError(t("errors.markAll"));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await notificationService.deleteAllNotifications(user.uid);
      setFilter("all");
    } catch (error) {
      console.error("Error eliminando notificaciones:", error);
      showError(t("errors.deleteAll"));
    }
  };

  const confirmDeleteAll = () => {
    confirmDestructive({
      header: t("confirmDelete.header"),
      message: t("confirmDelete.message"),
      acceptLabel: t("deleteAll"),
      onAccept: handleDeleteAll
    });
  };

  const renderResults = () => {
    if (error) {
      return <NotificationsEmptyState variant="error" onAction={retry} />;
    }

    if (loading) {
      return (
        <ul className="notif-list notif-list--card" aria-busy="true" aria-label={t("loading")}>
          {Array.from({ length: 5 }, (_, i) => <NotificationItemSkeleton key={i} />)}
        </ul>
      );
    }

    if (notifications.length === 0) {
      return <NotificationsEmptyState variant="empty" />;
    }

    if (sections.length === 0) {
      return <NotificationsEmptyState variant={filter} onAction={() => setFilter("all")} />;
    }

    return sections.map((section) => (
      <section key={section.key} className="notif-section">
        <h2 className="notif-section__title">{t(`sections.${section.key}`)}</h2>
        <ul className="notif-list notif-list--card">
          {section.items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onOpen={handleOpenNotification}
              onAccept={handleAcceptFriendRequest}
              onReject={handleRejectFriendRequest}
              onError={showError}
            />
          ))}
        </ul>
      </section>
    ));
  };

  const hasNotifications = !loading && !error && notifications.length > 0;

  return (
    <div className="feed notifications">
      <NotificationsHeader
        unreadCount={counts.unread}
        hasNotifications={hasNotifications}
        markingAll={markingAll}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteAll={confirmDeleteAll}
      />

      {hasNotifications && (
        <NotificationsFilters
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />
      )}

      {renderResults()}

      <ConfirmDialog />
      <Toast ref={toast} />
    </div>
  );
}
