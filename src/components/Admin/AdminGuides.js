import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import AdminGuideItem from "./AdminGuideItem";
import { EmptyState } from "../EmptyState";
import { useGuideReview, useUserProfiles } from "../../hooks";
import "../Posts/Feed.css";
import "../Guides/Guides.css";
import "./Admin.css";

// /admin/guides: guías por revisar. Aprobar las publica en /guias; rechazar
// las deja visibles solo para su autor, con la nota del moderador.
export default function AdminGuides() {
  const { t } = useTranslation("guides");
  const toast = useRef(null);
  const { guides, loading, error, review } = useGuideReview();

  const authorIds = useMemo(() => [...new Set(guides.map((guide) => guide.authorId))], [guides]);
  const { profiles } = useUserProfiles(authorIds);

  const handleReview = useCallback(async (guideId, status, note) => {
    try {
      await review(guideId, status, note);
      toast.current?.show({
        severity: "success",
        summary: t("common:status.done"),
        detail: t(status === "approved" ? "admin.approved" : "admin.rejected"),
        life: 2500
      });
    } catch (err) {
      console.error("Error revisando la guía:", err);
      toast.current?.show({
        severity: "error",
        summary: t("common:status.error"),
        detail: t("admin.reviewError"),
        life: 3000
      });
    }
  }, [review, t]);

  const renderBody = () => {
    if (loading) {
      return (
        <div className="admin-reports" aria-busy="true" aria-label={t("admin.loading")}>
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} height="220px" borderRadius="16px" className="feed-skeleton" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState icon="pi-exclamation-triangle" title={t("admin.errorTitle")} text={t("admin.errorText")} alert />
      );
    }

    if (guides.length === 0) {
      return <EmptyState icon="pi-check-circle" title={t("admin.emptyTitle")} text={t("admin.emptyText")} />;
    }

    return (
      <ul className="admin-reports">
        {guides.map((guide) => (
          <AdminGuideItem
            key={guide.id}
            guide={guide}
            author={profiles[guide.authorId]}
            onReview={handleReview}
          />
        ))}
      </ul>
    );
  };

  return (
    <div className="feed admin">
      <header className="feed-header">
        <div className="feed-header__titles">
          <span className="feed-header__eyebrow">{t("admin.eyebrow")}</span>
          <h1 className="feed-header__title">
            {guides.length > 0 ? t("admin.titleCount", { count: guides.length }) : t("admin.title")}
          </h1>
        </div>
      </header>

      {renderBody()}

      <Toast ref={toast} />
    </div>
  );
}
