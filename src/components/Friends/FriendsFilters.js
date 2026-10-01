import { useTranslation } from "react-i18next";

const FILTERS = [
  { value: "all", labelKey: "friends.filterAll" },
  { value: "online", labelKey: "friends.filterOnline" }
];

export default function FriendsFilters({ filter, onFilterChange, counts }) {
  const { t } = useTranslation("friends");

  return (
    <div className="feed-filters" role="group" aria-label={t("friends.filtersLabel")}>
      {FILTERS.map(({ value, labelKey }) => {
        const active = filter === value;

        return (
          <button
            key={value}
            type="button"
            className={`feed-chip${active ? " feed-chip--active" : ""}`}
            aria-pressed={active}
            onClick={() => onFilterChange(value)}
          >
            {t(labelKey)}
            <span className="feed-chip__count">{counts[value]}</span>
          </button>
        );
      })}
    </div>
  );
}
