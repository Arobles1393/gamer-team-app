import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";

// Textos en common:news.empty.{variant}.title / text / action
const STATES = {
  empty: { icon: "pi-megaphone", hasAction: false },
  noMatch: { icon: "pi-search", hasAction: true },
  error: { icon: "pi-exclamation-triangle", hasAction: true }
};

export default function NewsEmptyState({ variant, search = "", onAction }) {
  const { t } = useTranslation();
  const { icon, hasAction } = STATES[variant];
  const key = `news.empty.${variant}`;

  return (
    <EmptyState
      icon={icon}
      title={t(`${key}.title`)}
      text={t(`${key}.text`, { search: search.trim() })}
      actionLabel={hasAction ? t(`${key}.action`) : null}
      onAction={onAction}
      alert={variant === "error"}
    />
  );
}
