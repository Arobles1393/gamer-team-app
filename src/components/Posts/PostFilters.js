import { Dropdown } from "primereact/dropdown";
import { platformLabels } from "../../utils";

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      className={`feed-chip${active ? " feed-chip--active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function PostFilters({
  filterGame,
  onGameChange,
  filterPlatform,
  onPlatformChange,
  gameOptions
}) {
  // Clic en el chip activo lo desactiva (vuelve a "todas las plataformas")
  const handlePlatformClick = (value) => {
    onPlatformChange(filterPlatform === value ? null : value);
  };

  return (
    <div className="feed-filters" role="group" aria-label="Filtros">
      <Dropdown
        value={filterGame}
        options={gameOptions}
        onChange={(e) => onGameChange(e.value)}
        optionLabel="label"
        optionValue="value"
        placeholder="Todos los juegos"
        className="feed-chip feed-chip--select"
        panelClassName="feed-select-panel"
        aria-label="Filtrar por juego"
      />

      {Object.entries(platformLabels).map(([value, label]) => (
        <FilterChip
          key={value}
          label={label}
          active={filterPlatform === value}
          onClick={() => handlePlatformClick(value)}
        />
      ))}
    </div>
  );
}
