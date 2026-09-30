// Chips por fuente (IGN, GameSpot…), generados a partir de las noticias
export default function NewsFilters({ sources, source, onSourceChange, total }) {
  const chips = [
    { value: null, label: "Todas", count: total },
    ...sources.map(({ name, count }) => ({ value: name, label: name, count }))
  ];

  return (
    <div className="feed-filters" role="group" aria-label="Filtrar por fuente">
      {chips.map(({ value, label, count }) => {
        const active = source === value;

        return (
          <button
            key={label}
            type="button"
            className={`feed-chip${active ? " feed-chip--active" : ""}`}
            aria-pressed={active}
            onClick={() => onSourceChange(value)}
          >
            {label}
            <span className="feed-chip__count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
