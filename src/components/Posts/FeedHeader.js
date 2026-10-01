import { Button } from "primereact/button";
import { useTranslation } from "react-i18next";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";

export default function FeedHeader({
  title,
  search,
  onSearchChange,
  onCreatePost
}) {
  const { t } = useTranslation("posts");

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
            placeholder={t("feed.searchPlaceholder")}
            aria-label={t("feed.searchLabel")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </IconField>

        <Button
          label={t("feed.publish")}
          icon="pi pi-plus"
          className="feed-publish"
          onClick={onCreatePost}
        />
      </div>
    </header>
  );
}
