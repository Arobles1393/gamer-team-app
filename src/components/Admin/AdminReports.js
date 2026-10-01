import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import AdminReportItem from "./AdminReportItem";
import { EmptyState } from "../EmptyState";
import { UserProfileDialog } from "../UserProfile";
import { reportService } from "../../services/reports";
import { usePendingReports, usePostListActions, useUserProfiles } from "../../hooks";
import { useCurrentUser } from "../../context";
import "../Posts/Feed.css";
import "./Admin.css";

const noop = () => {};

// /admin/reports: reportes pendientes. Solo ver y marcar como revisado;
// las acciones correctivas (borrar, bloquear) se hacen a mano.
export default function AdminReports() {
  const { t } = useTranslation("reports");
  const user = useCurrentUser();
  const toast = useRef(null);
  const { reports, loading, error } = usePendingReports();

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  // Solo para abrir el perfil de un usuario reportado
  const { openProfile, profileDialogProps } = usePostListActions({
    user,
    setEditingPost: noop,
    setShowCreatePost: noop,
    showToast
  });

  // Quién reporta y, en reportes de usuario, a quién
  const userIds = useMemo(
    () => [...new Set(reports.flatMap((report) =>
      report.targetType === "user" ? [report.reporterId, report.targetId] : [report.reporterId]
    ))],
    [reports]
  );
  const { profiles } = useUserProfiles(userIds);

  const handleMarkReviewed = async (reportId) => {
    try {
      await reportService.markReportReviewed(reportId);
    } catch (err) {
      console.error("Error marcando reporte:", err);
      showToast("error", t("common:status.error"), t("admin.markError"));
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div className="admin-reports" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} height="150px" borderRadius="16px" className="feed-skeleton" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon="pi-exclamation-triangle"
          title={t("admin.errorTitle")}
          text={t("admin.errorText")}
          alert
        />
      );
    }

    if (reports.length === 0) {
      return (
        <EmptyState
          icon="pi-check-circle"
          title={t("admin.emptyTitle")}
          text={t("admin.emptyText")}
        />
      );
    }

    return (
      <ul className="admin-reports">
        {reports.map((report) => (
          <AdminReportItem
            key={report.id}
            report={report}
            reporter={profiles[report.reporterId]}
            targetUser={report.targetType === "user" ? profiles[report.targetId] : null}
            onOpenProfile={openProfile}
            onMarkReviewed={handleMarkReviewed}
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
            {reports.length > 0
              ? t("admin.titleCount", { count: reports.length })
              : t("admin.title")}
          </h1>
        </div>
      </header>

      {renderBody()}

      <UserProfileDialog {...profileDialogProps} />
      <Toast ref={toast} />
    </div>
  );
}
