//import "./FavoriteGames.css"; descomentar cuando en el index.css se quiten los estilos que ya estan en el archivo FavoriteGames.css


export default function FavoriteGames({ games }) {
  return (
    <section className="favorite-games">
      <h4>Juegos favoritos</h4>

      {games?.length > 0 ? (
        <div className="games-grid">
          {games.map((game) => (
            <div key={game.id} className="game-card">
              <img
                src={game.image}
                alt={game.name}
              />

              <div className="game-card-overlay">
                {game.name}
              </div>
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