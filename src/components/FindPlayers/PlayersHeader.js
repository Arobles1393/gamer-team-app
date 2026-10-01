import { useTranslation } from "react-i18next";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";

export default function PlayersHeader({ search, onSearchChange }) {
  const { t } = useTranslation("friends");

  return (
    <header className="feed-header">
      <div className="feed-header__titles">
        <span className="feed-header__eyebrow">GamerMatch</span>
        <h1 className="feed-header__title">{t("players.title")}</h1>
      </div>

      <div className="feed-header__actions">
        <IconField iconPosition="left" className="feed-search players-search">
          <InputIcon className="pi pi-search" />
          <InputText
            type="search"
            className="feed-search__input"
            placeholder={t("players.searchPlaceholder")}
            aria-label={t("players.searchLabel")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
          />
        </IconField>
      </div>
    </header>
  );
}
