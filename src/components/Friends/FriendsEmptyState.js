import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";

// Textos en friends:friends.empty.{variant}.title / text / action
const ICONS = {
  empty: "pi-user-plus",
  noMatch: "pi-search",
  offline: "pi-moon",
  error: "pi-exclamation-triangle"
};

export default function FriendsEmptyState({ variant, search, onAction }) {
  const { t } = useTranslation("friends");
  const key = `friends.empty.${variant}`;

  return (
    <EmptyState
      icon={ICONS[variant]}
      title={t(`${key}.title`)}
      text={t(`${key}.text`, { search: search.trim() })}
      actionLabel={t(`${key}.action`)}
      onAction={onAction}
      alert={variant === "error"}
    />
  );
}
