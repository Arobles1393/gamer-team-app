import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
import { UserAvatar } from "../UserAvatar";
import { commentsService } from "../../services/posts";
import { REPORT_REASONS } from "../../services/reports";
import { formatDates } from "../../utils";

const TYPE_ICONS = {
  user: "pi-user",
  post: "pi-file",
  comment: "pi-comment"
};

// Link al contenido reportado: perfil (diálogo), post o el post del comentario
function ReportTarget({ report, targetUser, onOpenProfile }) {
  const { t } = useTranslation("reports");
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
        {t("admin.viewProfile", { username: targetUser?.username || t("admin.userFallback") })}
      </button>
    );
  }

  if (report.targetType === "post") {
    return (
      <Link to={`/post/${report.targetId}`} className="admin-report__link">
        <i className="pi pi-external-link" aria-hidden="true" />
        {t("admin.viewPost")}
      </Link>
    );
  }

  if (comment === undefined) {
    return <span className="admin-report__muted">{t("admin.loadingComment")}</span>;
  }

  if (!comment) {
    return <span className="admin-report__muted">{t("admin.commentGone")}</span>;
  }

  return (
    <>
      {comment.text && <blockquote className="admin-report__quote">{comment.text}</blockquote>}
      <Link to={`/post/${comment.postId}`} className="admin-report__link">
        <i className="pi pi-external-link" aria-hidden="true" />
        {t("admin.viewComment")}
      </Link>
    </>
  );
}

export default function AdminReportItem({ report, reporter, targetUser, onOpenProfile, onMarkReviewed }) {
  const { t } = useTranslation("reports");
  const [marking, setMarking] = useState(false);
  const type = TYPE_ICONS[report.targetType] ? report.targetType : "post";
  // Motivos desconocidos (datos viejos) se muestran tal cual
  const reason = REPORT_REASONS.includes(report.reason)
    ? t(`reasons.${report.reason}`)
    : report.reason;

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
          <i className={`pi ${TYPE_ICONS[type]}`} aria-hidden="true" />
          {t(`admin.types.${type}`)}
        </span>
        <span className="admin-report__reason">{reason}</span>
        <span className="admin-report__date">{formatDates.formatDateN(report.createdAt)}</span>
      </div>

      <div className="admin-report__reporter">
        <UserAvatar
          image={reporter?.avatar}
          username={reporter?.username}
          className="admin-report__avatar"
        />
        <span>
          {t("admin.reportedBy")} <strong>{reporter?.username || t("admin.userFallback")}</strong>
        </span>
      </div>

      {report.note && <p className="admin-report__note">“{report.note}”</p>}

      <div className="admin-report__footer">
        <div className="admin-report__target">
          <ReportTarget report={report} targetUser={targetUser} onOpenProfile={onOpenProfile} />
        </div>

        <Button
          label={t("admin.markReviewed")}
          icon="pi pi-check"
          className="gm-btn gm-btn--ghost"
          loading={marking}
          onClick={handleMark}
        />
      </div>
    </li>
  );
}
