import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
import { UserAvatar } from "../UserAvatar";
import { commentsService } from "../../services/posts";
import { REPORT_REASONS } from "../../services/reports";
import { formatDates } from "../../utils";

const TYPE_LABELS = {
  user: { label: "Usuario", icon: "pi-user" },
  post: { label: "Publicación", icon: "pi-file" },
  comment: { label: "Comentario", icon: "pi-comment" }
};

const reasonLabel = (reason) =>
  REPORT_REASONS.find((option) => option.value === reason)?.label || reason;

// Link al contenido reportado: perfil (diálogo), post o el post del comentario
function ReportTarget({ report, targetUser, onOpenProfile }) {
  const [comment, setComment] = useState(undefined);

  useEffect(() => {
    if (report.targetType !== "comment") return;

    let cancelled = false;

    commentsService.getComment(report.targetId)
      .then((data) => !cancelled && setComment(data))
      .catch(() => !cancelled && setComment(null));

    return () => {
      cancelled = true;
    };
  }, [report.targetType, report.targetId]);

  if (report.targetType === "user") {
    return (
      <button type="button" className="admin-report__link" onClick={() => onOpenProfile(report.targetId)}>
        <i className="pi pi-external-link" aria-hidden="true" />
        Ver perfil de {targetUser?.username || "usuario"}
      </button>
    );
  }

  if (report.targetType === "post") {
    return (
      <Link to={`/post/${report.targetId}`} className="admin-report__link">
        <i className="pi pi-external-link" aria-hidden="true" />
        Ver publicación
      </Link>
    );
  }

  if (comment === undefined) {
    return <span className="admin-report__muted">Cargando comentario…</span>;
  }

  if (!comment) {
    return <span className="admin-report__muted">El comentario ya no existe</span>;
  }

  return (
    <>
      {comment.text && <blockquote className="admin-report__quote">{comment.text}</blockquote>}
      <Link to={`/post/${comment.postId}`} className="admin-report__link">
        <i className="pi pi-external-link" aria-hidden="true" />
        Ver comentario en su publicación
      </Link>
    </>
  );
}

export default function AdminReportItem({ report, reporter, targetUser, onOpenProfile, onMarkReviewed }) {
  const [marking, setMarking] = useState(false);
  const type = TYPE_LABELS[report.targetType] ?? TYPE_LABELS.post;

  const handleMark = async () => {
    setMarking(true);

    try {
      await onMarkReviewed(report.id);
    } finally {
      setMarking(false);
    }
  };

  return (
    <li className="admin-report">
      <div className="admin-report__head">
        <span className="admin-report__type">
          <i className={`pi ${type.icon}`} aria-hidden="true" />
          {type.label}
        </span>
        <span className="admin-report__reason">{reasonLabel(report.reason)}</span>
        <span className="admin-report__date">{formatDates.formatDateN(report.createdAt)}</span>
      </div>

      <div className="admin-report__reporter">
        <UserAvatar
          image={reporter?.avatar}
          username={reporter?.username}
          className="admin-report__avatar"
        />
        <span>
          Reportado por <strong>{reporter?.username || "usuario"}</strong>
        </span>
      </div>

      {report.note && <p className="admin-report__note">“{report.note}”</p>}

      <div className="admin-report__footer">
        <div className="admin-report__target">
          <ReportTarget report={report} targetUser={targetUser} onOpenProfile={onOpenProfile} />
        </div>

        <Button
          label="Marcar como revisado"
          icon="pi pi-check"
          className="gm-btn gm-btn--ghost"
          loading={marking}
          onClick={handleMark}
        />
      </div>
    </li>
  );
}
