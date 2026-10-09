import { useTranslation } from "react-i18next";
import { platforms } from "../../constants";
import { getPlatformKey, platformLabels } from "../../utils";

// Plataformas a mostrar como badges: la elegida o, si es multiplataforma, las del juego
const getPlatformBadges = (post) => {
  if (!post.multiplatform) {
    const label =
      platformLabels[post.platform] ??
      platforms.find((option) => option.value === post.platform)?.label;

    return label ? [label] : [];
  }

  const keys = [...new Set((post.platforms ?? []).map(getPlatformKey).filter(Boolean))];
  return keys.map((key) => platformLabels[key]);
};


const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/**
 * Banner del detalle: clip del juego (o su imagen) de fondo, portada vertical,
 * logo o nombre del juego y badges de plataforma / jugadores.
 */
export default function PostDetailHero({ post, onBack }) {
  const { t } = useTranslation("posts");
  const badges = getPlatformBadges(post);
  const playersNeeded = Number(post.playersNeeded) || 0;
  const showClip = Boolean(post.clip) && !prefersReducedMotion();

  return (
    <section className="post-hero">
      <div className="post-hero__media" aria-hidden="true">
        {showClip ? (
          <video
            src={post.clip}
            poster={post.image || undefined}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          post.image && <img src={post.image} alt="" />
        )}
      </div>

      <button type="button" className="post-hero__back" onClick={onBack}>
        <i className="pi pi-arrow-left" aria-hidden="true" />
        <span>{t("detail.back")}</span>
      </button>

      <div className="post-hero__content">
        {post.portada && (
          <img
            src={post.portada}
            alt={t("detail.cover", { game: post.game })}
            className="post-hero__cover"
          />
        )}

        <div className="post-hero__info">
          <span className="post-hero__eyebrow">{t("detail.eyebrow")}</span>

          {post.logo ? (
            <>
              <img src={post.logo} alt="" className="post-hero__logo" />
              <h1 className="post-hero__sr">{post.game}</h1>
            </>
          ) : (
            <h1 className="post-hero__title">{post.game}</h1>
          )}

          <div className="post-hero__badges">
            {post.multiplatform && (
              <span className="post-hero__badge post-hero__badge--accent">{t("create.multiplatform")}</span>
            )}
            {badges.map((label) => (
              <span key={label} className="post-hero__badge">{label}</span>
            ))}
            {playersNeeded > 0 && (
              <span className="post-hero__badge">
                <i className="pi pi-user" aria-hidden="true" />
                {t("detail.lookingFor", { count: playersNeeded })}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
