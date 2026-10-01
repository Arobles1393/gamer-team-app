import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";

// Textos en friends:players.empty.{variant}.title / text / action
const STATES = {
  idle: { icon: "pi-users", hasAction: false },
  empty: { icon: "pi-search", hasAction: true },
  error: { icon: "pi-exclamation-triangle", hasAction: true }
};

export default function PlayersEmptyState({ variant, search, onAction }) {
  const { t } = useTranslation("friends");
  const { icon, hasAction } = STATES[variant];
  const key = `players.empty.${variant}`;

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
