import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { ProfileSection } from "../ProfileSection";
import { useMyGuides } from "../../hooks";
import { formatDates } from "../../utils";
import { GuideStatusBadge, GuideTypeBadge } from "./GuideBadges";
import "./Guides.css";

// Mi perfil: mis guías con su estado de revisión (y la nota si la rechazaron)
export default function MyGuides({ user }) {
  const { t } = useTranslation("guides");
  const navigate = useNavigate();
  const { guides, loading } = useMyGuides(user);

  const writeButton = (
    <Button
      icon="pi pi-pencil"
      label={t("mine.write")}
      className="gm-btn gm-btn--ghost my-guides__write"
      onClick={() => navigate("/guias/nueva")}
    />
  );

  return (
    <ProfileSection title={t("mine.title")} icon="pi-book" className="my-guides" action={guides.length > 0 && writeButton}>
      {loading ? null : guides.length === 0 ? (
        <div className="my-guides__empty">
          <p className="gm-section__empty">{t("mine.empty")}</p>
          {writeButton}
        </div>
      ) : (
        <ul className="my-guides__list">
          {guides.map((guide) => (
            <li key={guide.id}>
              <Link to={`/guias/${guide.id}`} className="my-guides__item">
                <span className="my-guides__info">
                  <span className="my-guides__title">{guide.title}</span>
                  <span className="my-guides__meta">
                    {guide.game} · {formatDates.formatDateN(guide.createdAt).toLowerCase()}
                  </span>
                  {guide.status === "rejected" && guide.reviewNote && (
                    <span className="my-guides__note">{t("detail.reviewNote", { note: guide.reviewNote })}</span>
                  )}
                </span>
                <span className="my-guides__badges">
                  <GuideTypeBadge type={guide.type} />
                  <GuideStatusBadge status={guide.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ProfileSection>
  );
}
