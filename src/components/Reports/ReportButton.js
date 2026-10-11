import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useReportDialog } from "../../hooks";
import { useCurrentUser } from "../../context";
import ReportDialog from "./ReportDialog";
import "./ReportDialog.css";

// Botón discreto de bandera + su diálogo (posts y comentarios). El diálogo se
// monta la primera vez que se abre (no uno por cada card) y después queda
// montado: al enviar se cierra, y si se desmontara se llevaría consigo el
// aviso "Reporte enviado" antes de mostrarlo. Sin sesión, manda al login.
export default function ReportButton({ targetType, targetId, label, className = "" }) {
  const { t } = useTranslation("reports");
  const user = useCurrentUser();
  const { reportTarget, openReport, closeReport } = useReportDialog(user);
  const [opened, setOpened] = useState(false);

  // Dentro de una card clicable: ni el botón ni el diálogo (aunque se monte
  // en <body>, sus eventos suben por el árbol de React) deben abrir el post
  const stop = (event) => event.stopPropagation();

  return (
    <span className="report-trigger-wrap" onClick={stop} onKeyDown={stop}>
      <button
        type="button"
        className={`report-trigger ${className}`.trim()}
        aria-label={t(`titles.${targetType}`)}
        title={t("button.title")}
        onClick={() => {
          setOpened(true);
          openReport(targetType, targetId, label);
        }}
      >
        <i className="pi pi-flag" aria-hidden="true" />
      </button>

      {opened && (
        <ReportDialog target={reportTarget} onHide={closeReport} />
      )}
    </span>
  );
}
