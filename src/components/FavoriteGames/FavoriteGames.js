import { AutoComplete } from "primereact/autocomplete";
import "./FavoriteGames.css";

export default function FavoriteGames({
  games,
  isEditing = false,
  gameQuery = "",
  suggestions = [],
  onSearch,
  onGameQueryChange,
  onAddGame,
  onRemoveGame
}) {

  const itemTemplate = (item) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
      }}
    >
      <img
        src={item.image}
        alt={item.label}
        style={{
          width: "40px",
          borderRadius: "6px"
        }}
      />
      <span>{item.label}</span>
    </div>
  );

  return (
    <section className="favorite-games">
      <h4>Juegos favoritos</h4>
      {isEditing && (
        <AutoComplete
          value={gameQuery}
          suggestions={suggestions}
          completeMethod={onSearch}
          onChange={(e) => onGameQueryChange(e.value)}
          onSelect={(e) => onAddGame(e.value)}
          field="label"
          itemTemplate={itemTemplate}
          placeholder="Nombre del juego"
          style={{
            flex: 1,
            marginBottom: "2rem"
          }}
        />
      )}
      {games?.length > 0 ? (
        <div className="games-grid">
          {games.map((game) => (
            <div
              key={game.id}
              className="game-card"
            >
              <img
                src={game.image}
                alt={game.name}
              />
              <div className="game-card-overlay">
                {game.name}
              </div>
              {isEditing && (
                <button
                  className="remove-btn"
                  onClick={() => onRemoveGame(game.id)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="favorite-games-empty">
          No hay juegos que mostrar
        </p>
      )}
    </section>
  );
}