import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";

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
    <div className="feed-empty" role={variant === "error" ? "alert" : "status"}>
      <span className="feed-empty__icon">
        <i className={`pi ${icon}`} aria-hidden="true" />
      </span>
      <p className="feed-empty__title">{t(`${key}.title`)}</p>
      <p className="feed-empty__text">{t(`${key}.text`, { search: search.trim() })}</p>
      {hasAction && (
        <Button label={t(`${key}.action`)} className="feed-empty__btn" onClick={onAction} />
      )}
    </div>
  );
}
