import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";

// Textos en notifications:empty.{variant}.title / text / action
const STATES = {
  empty: { icon: "pi-bell", hasAction: false },
  unread: { icon: "pi-check-circle", hasAction: true },
  requests: { icon: "pi-user-plus", hasAction: true },
  error: { icon: "pi-exclamation-triangle", hasAction: true }
};

export default function NotificationsEmptyState({ variant, onAction }) {
  const { t } = useTranslation("notifications");
  const { icon, hasAction } = STATES[variant];
  const key = `empty.${variant}`;

  return (
    <div className="feed-empty" role={variant === "error" ? "alert" : "status"}>
      <span className="feed-empty__icon">
        <i className={`pi ${icon}`} aria-hidden="true" />
      </span>
      <p className="feed-empty__title">{t(`${key}.title`)}</p>
      <p className="feed-empty__text">{t(`${key}.text`)}</p>
      {hasAction && (
        <Button label={t(`${key}.action`)} className="feed-empty__btn" onClick={onAction} />
      )}
    </div>
  );
}
