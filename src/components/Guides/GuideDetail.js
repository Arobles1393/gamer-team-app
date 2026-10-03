import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "primereact/skeleton";
import { EmptyState } from "../EmptyState";
import { UserAvatar } from "../UserAvatar";
import { useBlockedIds, useGuide, useUserProfile } from "../../hooks";
import { useCurrentUser } from "../../context";
import { formatDates, sanitizeGuideHtml } from "../../utils";
import { GuideStatusBadge, GuideTypeBadge } from "./GuideBadges";
import LinkPreviewCard from "./LinkPreviewCard";
import YoutubeEmbed from "./YoutubeEmbed";
import "../Posts/Feed.css";
import "./Guides.css";

function GuideDetailSkeleton() {
  const { t } = useTranslation("guides");

  return (
    <div className="feed guides guide-detail" aria-busy="true" aria-label={t("detail.loading")}>
      <Skeleton height="36px" width="60%" />
      <Skeleton height="220px" borderRadius="16px" />
      <Skeleton height="16px" />
      <Skeleton height="16px" width="80%" />
    </div>
  );
}

// /guias/:id. La guía escrita se renderiza con su HTML sanitizado OTRA VEZ
// al mostrarla (aunque se sanitizó al guardar: el documento se puede escribir
// saltándose la app). La externa muestra su vista previa y el link.
export default function GuideDetail() {
  const { t } = useTranslation("guides");
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const user = useCurrentUser();
  const { guide, loading, error } = useGuide(id);
  const { userData: author } = useUserProfile(guide?.authorId);
  const { blockedIds, loading: loadingBlocks } = useBlockedIds(user);

  const safeHtml = useMemo(
    () => (guide?.type === "original" ? sanitizeGuideHtml(guide.content) : ""),
    [guide]
  );

  if (loading || loadingBlocks) {
    return <GuideDetailSkeleton />;
  }

  // No existe, no se puede ver (pendiente de otro) o hay bloqueo con el autor
  if (error || !guide || blockedIds.includes(guide.authorId)) {
    return (
      <div className="feed guides guide-detail">
        <EmptyState
          icon={error ? "pi-exclamation-triangle" : "pi-book"}
          title={t("detail.notFoundTitle")}
          text={t("detail.notFoundText")}
          actionLabel={t("detail.toGuides")}
          onAction={() => navigate("/guias")}
          alert={error}
        />
      </div>
    );
  }

  const username = author?.username || t("player");
  const isAuthor = user?.uid === guide.authorId;

  return (
    <article className="feed guides guide-detail">
      <Link to="/guias" className="guide-detail__back">
        <i className="pi pi-arrow-left" aria-hidden="true" />
        {t("detail.back")}
      </Link>

      {/* Solo su autor (o un admin) ve una guía que no está aprobada */}
      {guide.status !== "approved" && (
        <div className={`guide-detail__notice guide-detail__notice--${guide.status}`} role="status">
          <GuideStatusBadge status={guide.status} />
          <span>
            {guide.status === "pending"
              ? (isAuthor && state?.justSent ? `${t("create.sent")}. ${t("create.sentDetail")}` : t("detail.pendingNotice"))
              : t("detail.rejectedNotice")}
            {guide.reviewNote && <> {t("detail.reviewNote", { note: guide.reviewNote })}</>}
          </span>
        </div>
      )}

      <header className="guide-detail__header">
        <div className="guide-detail__meta">
          <GuideTypeBadge type={guide.type} />
          <span className="guide-detail__game">{guide.game}</span>
        </div>
        <h1 className="guide-detail__title">{guide.title}</h1>
        <div className="guide-detail__author">
          <UserAvatar image={author?.avatar} username={username} className="guide-detail__avatar" />
          <span>{t("by", { username })}</span>
          <span className="guide-detail__date">· {formatDates.formatDateN(guide.createdAt).toLowerCase()}</span>
        </div>
      </header>

      {guide.type === "original" ? (
        <>
          {guide.coverImage && (
            <img className="guide-detail__cover" src={guide.coverImage} alt="" referrerPolicy="no-referrer" />
          )}
          <YoutubeEmbed videoId={guide.youtubeVideoId} title={t("detail.video")} />
          <div
            className="guide-content"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        </>
      ) : (
        <div className="guide-detail__external">
          <LinkPreviewCard url={guide.externalUrl} preview={guide.externalPreview} large />
          {/* externalUrl siempre es http(s): lo exige firestore.rules */}
          <a
            href={guide.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="guide-detail__open"
          >
            <i className="pi pi-external-link" aria-hidden="true" />
            {t("detail.openExternal")}
          </a>
        </div>
      )}
    </article>
  );
}
