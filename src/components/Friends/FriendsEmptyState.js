import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";

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
    <div className="feed-empty" role={variant === "error" ? "alert" : "status"}>
      <span className="feed-empty__icon">
        <i className={`pi ${ICONS[variant]}`} aria-hidden="true" />
      </span>
      <p className="feed-empty__title">{t(`${key}.title`)}</p>
      <p className="feed-empty__text">{t(`${key}.text`, { search: search.trim() })}</p>
      <Button label={t(`${key}.action`)} className="feed-empty__btn" onClick={onAction} />
    </div>
  );
}
