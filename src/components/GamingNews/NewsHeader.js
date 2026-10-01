import { useTranslation } from "react-i18next";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";

export default function NewsHeader({ search, onSearchChange, disabled }) {
  const { t } = useTranslation();

  return (
    <header className="feed-header">
      <div className="feed-header__titles">
        <span className="feed-header__eyebrow">GamerMatch</span>
        <h1 className="feed-header__title">{t("news.title")}</h1>
      </div>

      <div className="feed-header__actions">
        <IconField iconPosition="left" className="feed-search">
          <InputIcon className="pi pi-search" />
          <InputText
            type="search"
            className="feed-search__input"
            placeholder={t("news.searchPlaceholder")}
            aria-label={t("news.searchLabel")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={disabled}
          />
        </IconField>
      </div>
    </header>
  );
}
