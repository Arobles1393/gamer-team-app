import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";

export default function PlayersHeader({ search, onSearchChange }) {
  return (
    <header className="feed-header">
      <div className="feed-header__titles">
        <span className="feed-header__eyebrow">GamerMatch</span>
        <h1 className="feed-header__title">Buscar jugadores</h1>
      </div>

      <div className="feed-header__actions">
        <IconField iconPosition="left" className="feed-search players-search">
          <InputIcon className="pi pi-search" />
          <InputText
            type="search"
            className="feed-search__input"
            placeholder="Nombre de usuario…"
            aria-label="Buscar jugador por nombre de usuario"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
          />
        </IconField>
      </div>
    </header>
  );
}
