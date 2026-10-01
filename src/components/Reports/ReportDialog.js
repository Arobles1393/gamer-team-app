import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { REPORT_REASONS, reportService } from "../../services/reports";
import { useCurrentUser } from "../../context";
import "./ReportDialog.css";

const NOTE_MAX = 500;

const TARGET_TITLES = {
  user: "Reportar usuario",
  post: "Reportar publicación",
  comment: "Reportar comentario"
};

// Diálogo de reporte compartido (perfil, post, comentario).
// target: { targetType: "user" | "post" | "comment", targetId, label? }
export default function ReportDialog({ target, onHide }) {
  const user = useCurrentUser();
  const toast = useRef(null);
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  // Cada reporte empieza limpio
  useEffect(() => {
    if (target) {
      setReason(null);
      setNote("");
    }
  }, [target]);

  const needsNote = reason === "other";
  const canSend = Boolean(reason) && (!needsNote || note.trim()) && !sending;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSend || !user) return;

    setSending(true);

    try {
      await reportService.createReport({
        reporterId: user.uid,
        targetType: target.targetType,
        targetId: target.targetId,
        reason,
        note
      });

      toast.current?.show({
        severity: "success",
        summary: "Reporte enviado",
        detail: "Gracias, lo revisaremos.",
        life: 3000
      });
      onHide();
    } catch (error) {
      console.error("Error enviando reporte:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo enviar el reporte. Intenta de nuevo.",
        life: 3000
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Dialog
        header={target ? TARGET_TITLES[target.targetType] : ""}
        visible={Boolean(target)}
        onHide={onHide}
        className="gm-dialog report-dialog"
        maskClassName="gm-dialog-mask"
        style={{ width: "440px" }}
        breakpoints={{ "520px": "94vw" }}
        dismissableMask
        draggable={false}
        blockScroll
      >
        <form className="gm-form report-dialog__form" onSubmit={handleSubmit}>
          {target?.label && (
            <p className="report-dialog__target">{target.label}</p>
          )}

          <fieldset className="report-dialog__reasons">
            <legend className="gm-field__label">¿Cuál es el problema?</legend>

            {REPORT_REASONS.map((option) => (
              <label
                key={option.value}
                className={`report-dialog__reason${reason === option.value ? " report-dialog__reason--active" : ""}`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <div className="gm-field">
            <label className="gm-field__label" htmlFor="report-note">
              {needsNote ? "Cuéntanos qué pasa" : "Contexto"}
              {!needsNote && <span className="gm-field__hint"> (opcional)</span>}
            </label>
            <InputTextarea
              id="report-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={NOTE_MAX}
              autoResize
              className="gm-input"
              placeholder="Detalles que nos ayuden a revisar el reporte"
            />
          </div>

          <div className="report-dialog__actions">
            <Button
              type="button"
              label="Cancelar"
              className="gm-btn gm-btn--ghost"
              onClick={onHide}
            />
            <Button
              type="submit"
              label="Enviar reporte"
              icon="pi pi-flag"
              className="gm-btn gm-btn--primary"
              loading={sending}
              disabled={!canSend}
            />
          </div>
        </form>
      </Dialog>

      {/* Fuera del Dialog: el aviso sigue visible después de cerrarlo */}
      <Toast ref={toast} />
    </>
  );
}
