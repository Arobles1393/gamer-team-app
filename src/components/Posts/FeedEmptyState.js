import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";

// emptyText: mensaje propio de una categoría (p. ej. en /explorar)
export default function FeedEmptyState({ hasFilters, onClearFilters, emptyText }) {
  const { t } = useTranslation("posts");

  return hasFilters ? (
    <EmptyState
      icon="pi-filter-slash"
      title={t("empty.noMatchTitle")}
      text={t("empty.noMatchText")}
      actionLabel={t("common:actions.clearFilters")}
      onAction={onClearFilters}
    />
  ) : (
    <EmptyState
      icon="pi-inbox"
      title={t("empty.emptyTitle")}
      text={emptyText || t("empty.emptyText")}
    />
  );
}
