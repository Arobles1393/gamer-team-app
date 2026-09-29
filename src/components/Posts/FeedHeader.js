import { Button } from "primereact/button";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";

export default function FeedHeader({
  title,
  search,
  onSearchChange,
  onCreatePost
}) {
  return (
    <header className="feed-header">
      <div className="feed-header__titles">
        <span className="feed-header__eyebrow">GamerMatch</span>
        <h1 className="feed-header__title">{title}</h1>
      </div>

      <div className="feed-header__actions">
        <IconField iconPosition="left" className="feed-search">
          <InputIcon className="pi pi-search" />
          <InputText
            type="search"
            className="feed-search__input"
            placeholder="Buscar un juego…"
            aria-label="Buscar un juego"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </IconField>

        <Button
          label="Publicar"
          icon="pi pi-plus"
          className="feed-publish"
          onClick={onCreatePost}
        />
      </div>
    </header>
  );
}
