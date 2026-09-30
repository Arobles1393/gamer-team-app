import { Button } from "primereact/button";

// emptyText: mensaje propio de una categoría (p. ej. en /explorar)
export default function FeedEmptyState({ hasFilters, onClearFilters, emptyText }) {
  return (
    <div className="feed-empty" role="status">
      <span className="feed-empty__icon">
        <i className={`pi ${hasFilters ? "pi-filter-slash" : "pi-inbox"}`} aria-hidden="true" />
      </span>
      <p className="feed-empty__title">
        {hasFilters ? "Nada coincide con tu búsqueda" : "Todavía no hay partidas aquí"}
      </p>
      <p className="feed-empty__text">
        {hasFilters
          ? "Prueba con otro juego o plataforma."
          : emptyText || "Cuando alguien publique una partida, aparecerá en esta lista."}
      </p>
      {hasFilters && (
        <Button
          label="Limpiar filtros"
          className="feed-empty__btn"
          onClick={onClearFilters}
        />
      )}
    </div>
  );
}
