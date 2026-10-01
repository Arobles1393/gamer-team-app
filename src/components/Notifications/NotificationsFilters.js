import { useTranslation } from "react-i18next";

const FILTERS = ["all", "unread", "requests"];

export default function NotificationsFilters({ filter, onFilterChange, counts }) {
  const { t } = useTranslation("notifications");

  return (
    <div className="feed-filters" role="group" aria-label={t("filters.label")}>
      {FILTERS.map((value) => {
        const active = filter === value;

        return (
          <button
            key={value}
            type="button"
            className={`feed-chip${active ? " feed-chip--active" : ""}`}
            aria-pressed={active}
            onClick={() => onFilterChange(value)}
          >
            {t(`filters.${value}`)}
            <span className="feed-chip__count">{counts[value]}</span>
          </button>
        );
      })}
    </div>
  );
}
