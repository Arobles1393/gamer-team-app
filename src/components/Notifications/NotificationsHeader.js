import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";

export default function NotificationsHeader({
  unreadCount,
  hasNotifications,
  markingAll,
  onMarkAllAsRead,
  onDeleteAll
}) {
  const { t } = useTranslation("notifications");

  return (
    <header className="feed-header">
      <div className="feed-header__titles">
        <span className="feed-header__eyebrow">GamerMatch</span>
        <h1 className="feed-header__title">{t("title")}</h1>
      </div>

      {hasNotifications && (
        <div className="feed-header__actions notifications__actions">
          <Button
            label={t("markAllRead")}
            icon="pi pi-check"
            className="notifications__action"
            loading={markingAll}
            disabled={unreadCount === 0}
            onClick={onMarkAllAsRead}
          />
          <Button
            label={t("deleteAll")}
            icon="pi pi-trash"
            className="notifications__action notifications__action--danger"
            onClick={onDeleteAll}
          />
        </div>
      )}
    </header>
  );
}
