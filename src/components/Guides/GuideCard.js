import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { UserAvatar } from "../UserAvatar";
import { useUserProfile } from "../../hooks";
import { formatDates } from "../../utils";
import { GuideStatusBadge, GuideTypeBadge } from "./GuideBadges";

// Imagen de la card: la portada (escrita) o la de la vista previa (externa)
const coverOf = (guide) =>
  guide.type === "original" ? guide.coverImage : guide.externalPreview?.image;

// Card de una guía (lista de /guias y Mis guías). showStatus: Mis guías
function GuideCard({ guide, showStatus = false }) {
  const { t } = useTranslation("guides");
  // El autor se resuelve en vivo: la guía solo guarda authorId
  const { userData: author } = useUserProfile(guide.authorId);
  const username = author?.username || t("player");
  const cover = coverOf(guide);

  return (
    <Link to={`/guias/${guide.id}`} className="guide-card">
      <span className="guide-card__cover">
        {cover ? (
          <img src={cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <i className={`pi ${guide.type === "original" ? "pi-book" : "pi-external-link"}`} aria-hidden="true" />
        )}
        <span className="guide-card__badges">
          <GuideTypeBadge type={guide.type} />
          {showStatus && <GuideStatusBadge status={guide.status} />}
        </span>
      </span>

      <span className="guide-card__body">
        <span className="guide-card__game">{guide.game}</span>
        <span className="guide-card__title">{guide.title}</span>
        <span className="guide-card__author">
          <UserAvatar image={author?.avatar} username={username} className="guide-card__avatar" />
          <span className="guide-card__author-name">{t("by", { username })}</span>
          <span className="guide-card__date">· {formatDates.formatDateN(guide.createdAt).toLowerCase()}</span>
        </span>
      </span>
    </Link>
  );
}

export default memo(GuideCard);
