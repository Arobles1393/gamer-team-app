const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "online", label: "En línea" }
];

export default function FriendsFilters({ filter, onFilterChange, counts }) {
  return (
    <div className="feed-filters" role="group" aria-label="Filtrar amigos">
      {FILTERS.map(({ value, label }) => {
        const active = filter === value;

        return (
          <button
            key={value}
            type="button"
            className={`feed-chip${active ? " feed-chip--active" : ""}`}
            aria-pressed={active}
            onClick={() => onFilterChange(value)}
          >
            {label}
            <span className="feed-chip__count">{counts[value]}</span>
          </button>
        );
      })}
    </div>
  );
}
