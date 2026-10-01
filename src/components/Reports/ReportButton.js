import { useReportDialog } from "../../hooks";
import { useCurrentUser } from "../../context";
import ReportDialog from "./ReportDialog";
import "./ReportDialog.css";

// Botón discreto de bandera + su diálogo (posts y comentarios). El diálogo
// solo se monta mientras está abierto. Sin sesión, manda al login.
export default function ReportButton({ targetType, targetId, label, className = "" }) {
  const user = useCurrentUser();
  const { reportTarget, openReport, closeReport } = useReportDialog(user);

  // Dentro de una card clicable: ni el botón ni el diálogo (aunque se monte
  // en <body>, sus eventos suben por el árbol de React) deben abrir el post
  const stop = (event) => event.stopPropagation();

  return (
    <span className="report-trigger-wrap" onClick={stop} onKeyDown={stop}>
      <button
        type="button"
        className={`report-trigger ${className}`.trim()}
        aria-label={targetType === "post" ? "Reportar publicación" : "Reportar comentario"}
        title="Reportar"
        onClick={() => openReport(targetType, targetId, label)}
      >
        <i className="pi pi-flag" aria-hidden="true" />
      </button>

      {reportTarget && (
        <ReportDialog target={reportTarget} onHide={closeReport} />
      )}
    </span>
  );
}
