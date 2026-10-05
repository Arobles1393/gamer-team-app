import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLegalDocument } from "../../hooks";
import { getIntlLocale } from "../../i18n";
import "../Posts/Feed.css";
import "./Legal.css";

const formatDate = (isoDate) =>
  new Intl.DateTimeFormat(getIntlLocale(), { dateStyle: "long" }).format(new Date(`${isoDate}T12:00:00`));

/**
 * /privacidad y /terminos (públicas). Un solo componente para los dos
 * documentos: type "privacy" | "terms". El contenido sale de src/legal y se
 * muestra como texto plano (sin HTML).
 */
export default function LegalPage({ type }) {
  const { t } = useTranslation("legal");
  const { document: legalDoc, fallback, isDraft } = useLegalDocument(type);
  const title = t(`titles.${type}`);

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · GamerMatch`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  const goToSection = (event, id) => {
    event.preventDefault();
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`legal-${id}`)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <article className="feed legal">
      <header className="feed-header">
        <div className="feed-header__titles">
          <span className="feed-header__eyebrow">{t("eyebrow")}</span>
          <h1 className="feed-header__title">{title}</h1>
          <p className="legal__updated">
            {t("updatedAt", { date: legalDoc.updatedAt ? formatDate(legalDoc.updatedAt) : t("pending") })}
          </p>
        </div>
      </header>

      {isDraft && (
        <p className="legal__notice legal__notice--draft" role="note">
          <i className="pi pi-pencil" aria-hidden="true" />
          {t("draftNotice")}
        </p>
      )}
      {fallback && (
        <p className="legal__notice" role="note" lang="es">
          <i className="pi pi-globe" aria-hidden="true" />
          {t("onlySpanish")}
        </p>
      )}

      <div className="legal__layout" lang={fallback ? "es" : undefined}>
        <nav className="legal__toc" aria-label={t("tocLabel")}>
          <h2 className="legal__toc-title">{t("toc")}</h2>
          <ol>
            {legalDoc.sections.map((section) => (
              <li key={section.id}>
                <a href={`#legal-${section.id}`} onClick={(event) => goToSection(event, section.id)}>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal__sections">
          {legalDoc.sections.map((section, index) => (
            <section key={section.id} id={`legal-${section.id}`} className="legal__section" aria-labelledby={`legal-${section.id}-title`}>
              <h2 id={`legal-${section.id}-title`} className="legal__section-title">
                <span className="legal__section-number" aria-hidden="true">{index + 1}.</span>
                {section.title}
              </h2>
              {section.body.map((paragraph, i) => (
                <p key={i} className="legal__paragraph">{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
