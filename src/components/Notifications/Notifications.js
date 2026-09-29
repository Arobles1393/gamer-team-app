import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import NotificationItem from "./NotificationItem";
import NotificationItemSkeleton from "./NotificationItemSkeleton";
import NotificationsHeader from "./NotificationsHeader";
import NotificationsFilters from "./NotificationsFilters";
import NotificationsEmptyState from "./NotificationsEmptyState";
import { notificationService } from "../../services/notifications";
import { friendService } from "../../services/friends";
import { useNotifications } from "../../hooks";
import { navigateNotification, formatDates } from "../../utils";
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

const getSectionLabel = (timestamp) => {
  const date = formatDates.toDate(timestamp);
  if (!date) return "Anteriores";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const diff = startOfToday - date;

  if (diff <= 0) return "Hoy";
  if (diff <= DAY_MS) return "Ayer";
  if (diff <= 6 * DAY_MS) return "Esta semana";
  return "Anteriores";
};

// Vienen ordenadas por fecha desc: basta con cortar cuando cambia la sección
const groupBySection = (notifications) =>
  notifications.reduce((sections, notification) => {
    const label = getSectionLabel(notification.createdAt);
    const last = sections[sections.length - 1];

    if (last?.label === label) {
      last.items.push(notification);
    } else {
      sections.push({ label, items: [notification] });
    }

    return sections;
  }, []);

export default function Notifications() {
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
      summary: "Error",
      detail,
      life: 3000
    });
  }, []);

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
      showError("No se pudieron marcar como leídas. Intenta de nuevo.");
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
      showError("No se pudieron eliminar las notificaciones. Intenta de nuevo.");
    }
  };

  const confirmDeleteAll = () => {
    confirmDialog({
      header: "Eliminar notificaciones",
      message: "Se eliminarán todas tus notificaciones. Esta acción no se puede deshacer.",
      icon: "pi pi-trash",
      acceptLabel: "Eliminar todas",
      rejectLabel: "Cancelar",
      defaultFocus: "reject",
      className: "gm-confirm",
      acceptClassName: "gm-confirm__accept",
      rejectClassName: "gm-confirm__reject",
      style: { width: "440px" },
      breakpoints: { "640px": "92vw" },
      accept: handleDeleteAll
    });
  };

  const renderResults = () => {
    if (error) {
      return <NotificationsEmptyState variant="error" onAction={retry} />;
    }

    if (loading) {
      return (
        <ul className="notif-list notif-list--card" aria-busy="true" aria-label="Cargando notificaciones">
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
      <section key={section.label} className="notif-section">
        <h2 className="notif-section__title">{section.label}</h2>
        <ul className="notif-list notif-list--card">
          {section.items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onOpen={handleOpenNotification}
              onAccept={handleAcceptFriendRequest}
              onReject={handleRejectFriendRequest}
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
