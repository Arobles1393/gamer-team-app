import { useTranslation } from "react-i18next";
import { Skeleton } from "primereact/skeleton";

export default function CommunitySkeleton() {
  const { t } = useTranslation("community");

  return (
    <div className="community-layout" aria-busy="true" aria-label={t("loading")}>
      <Skeleton className="community-skeleton community-skeleton--map" borderRadius="16px" />
      <div className="community-skeleton__list">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} height="52px" borderRadius="12px" className="community-skeleton" />
        ))}
      </div>
    </div>
  );
}
