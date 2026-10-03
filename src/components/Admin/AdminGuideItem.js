import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { UserAvatar } from "../UserAvatar";
import { GuideTypeBadge, LinkPreviewCard, YoutubeEmbed } from "../Guides";
import { formatDates, sanitizeGuideHtml } from "../../utils";

const NOTE_MAX = 500;

// Una guía por revisar: su contenido (sanitizado, como se publicaría) y
// los botones de aprobar / rechazar con nota opcional para el autor
export default function AdminGuideItem({ guide, author, onReview }) {
  const { t } = useTranslation("guides");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(null);

  const safeHtml = useMemo(
    () => (guide.type === "original" ? sanitizeGuideHtml(guide.content) : ""),
    [guide]
  );

  const review = async (status) => {
    setSaving(status);
    try {
      await onReview(guide.id, status, note);
    } finally {
      setSaving(null);
    }
  };

  return (
    <li className="admin-report admin-guide">
      <div className="admin-report__head">
        <GuideTypeBadge type={guide.type} />
        <span className="admin-report__reason">{guide.game}</span>
        <span className="admin-report__date">{formatDates.formatDateN(guide.createdAt)}</span>
      </div>

      <h2 className="admin-guide__title">{guide.title}</h2>

      <div className="admin-report__reporter">
        <UserAvatar image={author?.avatar} username={author?.username} className="admin-report__avatar" />
        <span>
          {t("admin.sentBy")} <strong>{author?.username || t("player")}</strong>
        </span>
      </div>

      <div className="admin-guide__preview">
        {guide.type === "original" ? (
          <>
            {guide.coverImage && <img className="admin-guide__cover" src={guide.coverImage} alt="" referrerPolicy="no-referrer" />}
            <YoutubeEmbed videoId={guide.youtubeVideoId} title={guide.title} />
            <div
              className="guide-content guide-content--compact"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          </>
        ) : (
          <>
            <LinkPreviewCard url={guide.externalUrl} preview={guide.externalPreview} />
            {!guide.externalPreview && <p className="admin-report__muted">{t("admin.noPreview")}</p>}
            <a href={guide.externalUrl} target="_blank" rel="noopener noreferrer" className="admin-report__link">
              <i className="pi pi-external-link" aria-hidden="true" />
              {guide.externalUrl}
            </a>
          </>
        )}
      </div>

      <div className="admin-guide__review">
        <InputTextarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("admin.notePlaceholder")}
          aria-label={t("admin.noteLabel")}
          rows={2}
          autoResize
          maxLength={NOTE_MAX}
          className="gm-input"
        />
        <div className="admin-guide__actions">
          <Button
            label={t("admin.reject")}
            icon="pi pi-times"
            className="gm-btn gm-btn--ghost"
            loading={saving === "rejected"}
            disabled={Boolean(saving)}
            onClick={() => review("rejected")}
          />
          <Button
            label={t("admin.approve")}
            icon="pi pi-check"
            className="gm-btn gm-btn--primary"
            loading={saving === "approved"}
            disabled={Boolean(saving)}
            onClick={() => review("approved")}
          />
        </div>
      </div>
    </li>
  );
}
