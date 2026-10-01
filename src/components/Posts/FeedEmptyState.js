import { Button } from "primereact/button";
import { useTranslation } from "react-i18next";

// emptyText: mensaje propio de una categoría (p. ej. en /explorar)
export default function FeedEmptyState({ hasFilters, onClearFilters, emptyText }) {
  const { t } = useTranslation("posts");

  return (
    <div className="feed-empty" role="status">
      <span className="feed-empty__icon">
        <i className={`pi ${hasFilters ? "pi-filter-slash" : "pi-inbox"}`} aria-hidden="true" />
      </span>
      <p className="feed-empty__title">
        {hasFilters ? t("empty.noMatchTitle") : t("empty.emptyTitle")}
      </p>
      <p className="feed-empty__text">
        {hasFilters
          ? t("empty.noMatchText")
          : emptyText || t("empty.emptyText")}
      </p>
      {hasFilters && (
        <Button
          label={t("common:actions.clearFilters")}
          className="feed-empty__btn"
          onClick={onClearFilters}
        />
      )}
    </div>
  );
}
