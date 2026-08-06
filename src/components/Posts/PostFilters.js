import { Dropdown } from "primereact/dropdown";

export default function PostFilters({
  title,
  total,
  filterGame,
  onGameChange,
  filterPlatform,
  onPlatformChange,
  gameOptions,
  platformOptions
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem"
      }}
    >
      <h2 style={{ margin: 0 }}>
        {title}

        <span
          style={{
            marginLeft: "8px",
            color: "#666",
            fontSize: "16px"
          }}
        >
          ({total})
        </span>
      </h2>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem"
        }}
      >
        <Dropdown
          value={filterGame}
          options={gameOptions}
          onChange={(e) => onGameChange(e.value)}
          optionLabel="label"
          optionValue="value"
          placeholder="🎮 Juego"
        />

        <Dropdown
          value={filterPlatform}
          options={platformOptions}
          onChange={(e) => onPlatformChange(e.value)}
          optionLabel="label"
          optionValue="value"
          placeholder="🕹 Plataforma"
        />
      </div>
    </div>
  );
}