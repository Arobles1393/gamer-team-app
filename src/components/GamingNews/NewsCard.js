import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDates } from "../../utils";

/**
 * Noticia como link externo. `featured` es la más reciente, en grande.
 * Sin imagen (o si falla) se usa una portada con degradado del tema.
 */
function NewsCard({ item, featured = false }) {
  const { t } = useTranslation();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.image) && !imageFailed;

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`news-card${featured ? " news-card--featured" : ""}`}
    >
      <span className="news-card__media">
        {showImage ? (
          <img
            src={item.image}
            alt=""
            loading={featured ? "eager" : "lazy"}
            className="news-card__img"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="news-card__placeholder" aria-hidden="true">
            <i className="pi pi-megaphone" />
          </span>
        )}
        <span className="news-card__source">{item.source}</span>
      </span>

      <span className="news-card__body">
        <span className="news-card__time">
          {formatDates.formatDateN(item.publishedAt)}
        </span>
        <span className="news-card__title">{item.title}</span>
        {item.description && (
          <span className="news-card__description">{item.description}</span>
        )}
        <span className="news-card__cta">
          {t("news.readOn", { source: item.source })}
          <i className="pi pi-external-link" aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}

export default memo(NewsCard);
