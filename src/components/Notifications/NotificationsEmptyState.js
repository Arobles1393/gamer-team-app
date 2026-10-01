import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";

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
    <EmptyState
      icon={icon}
      title={t(`${key}.title`)}
      text={t(`${key}.text`)}
      actionLabel={hasAction ? t(`${key}.action`) : null}
      onAction={onAction}
      alert={variant === "error"}
    />
  );
}
