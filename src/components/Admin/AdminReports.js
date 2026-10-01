import { useCallback, useMemo, useRef } from "react";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import AdminReportItem from "./AdminReportItem";
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
      showToast("error", "Error", "No se pudo marcar el reporte como revisado.");
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
        <div className="feed-empty" role="alert">
          <span className="feed-empty__icon">
            <i className="pi pi-exclamation-triangle" aria-hidden="true" />
          </span>
          <p className="feed-empty__title">No se pudieron cargar los reportes</p>
          <p className="feed-empty__text">Revisa que tu cuenta tenga permiso de admin.</p>
        </div>
      );
    }

    if (reports.length === 0) {
      return (
        <div className="feed-empty" role="status">
          <span className="feed-empty__icon">
            <i className="pi pi-check-circle" aria-hidden="true" />
          </span>
          <p className="feed-empty__title">No hay reportes pendientes</p>
          <p className="feed-empty__text">Cuando alguien reporte algo, aparecerá aquí.</p>
        </div>
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
          <span className="feed-header__eyebrow">Admin</span>
          <h1 className="feed-header__title">
            Reportes{reports.length > 0 ? ` (${reports.length})` : ""}
          </h1>
        </div>
      </header>

      {renderBody()}

      <UserProfileDialog {...profileDialogProps} />
      <Toast ref={toast} />
    </div>
  );
}
