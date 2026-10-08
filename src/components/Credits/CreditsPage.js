import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CREDITS } from "../../credits/credits";
import { TRADEMARKS_NOTICE_ES } from "../../credits/trademarks";
import openSourceLibraries from "../../credits/openSourceLibraries.json";
import "../Posts/Feed.css";
import "../Legal/Legal.css";
import "./Credits.css";

// Enlaces externos: pestaña nueva sin acceso a esta ventana ni Referer
const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" };

/**
 * /creditos (pública): servicios externos (src/credits/credits.js),
 * librerías de código abierto (generadas por
 * scripts/generateThirdPartyNotices.js) y el aviso de marcas.
 */
export default function CreditsPage() {
  const { t, i18n } = useTranslation("credits");
  const title = t("page.title");
  const isSpanish = (i18n.resolvedLanguage || "es").startsWith("es");

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · GamerMatch`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <article className="feed credits">
      <header className="feed-header">
        <div className="feed-header__titles">
          <span className="feed-header__eyebrow">GamerMatch</span>
          <h1 className="feed-header__title">{title}</h1>
          <p className="credits__intro">{t("page.intro")}</p>
        </div>
      </header>

      <section className="credits__section" aria-labelledby="credits-services">
        <h2 id="credits-services" className="credits__title">{t("page.services")}</h2>
        <ul className="credits__services">
          {CREDITS.map((credit) => (
            <li key={credit.id} className="credits__service">
              <a href={credit.url} {...EXTERNAL} className="credits__service-name">
                {credit.name}
                <i className="pi pi-external-link" aria-hidden="true" />
                <span className="sr-only">{t("page.newTab")}</span>
              </a>
              <p className="credits__service-purpose">{t(credit.purposeKey)}</p>
              <span className="credits__category">{t(`category.${credit.category}`)}</span>
            </li>
          ))}
        </ul>
        <p className="credits__note">{t("page.owners")}</p>
      </section>

      <section className="credits__section" aria-labelledby="credits-open-source">
        <h2 id="credits-open-source" className="credits__title">{t("page.openSource")}</h2>
        <p className="credits__text">{t("page.openSourceIntro")}</p>
        <div className="credits__table-wrap">
          <table className="credits__table">
            <thead>
              <tr>
                <th scope="col">{t("page.library")}</th>
                <th scope="col">{t("page.version")}</th>
                <th scope="col">{t("page.license")}</th>
              </tr>
            </thead>
            <tbody>
              {openSourceLibraries.map((lib) => (
                <tr key={lib.name}>
                  <td>
                    <a href={lib.url} {...EXTERNAL}>{lib.name}</a>
                  </td>
                  <td className="credits__mono">{lib.version}</td>
                  <td className="credits__mono">{lib.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="credits__text">
          <a href="/third-party-licenses.txt" {...EXTERNAL} className="credits__licenses-link">
            <i className="pi pi-file" aria-hidden="true" />
            {t("page.fullLicenses")}
          </a>
        </p>
      </section>

      <section className="credits__section" aria-labelledby="credits-trademarks">
        <h2 id="credits-trademarks" className="credits__title">{t("page.trademarks")}</h2>
        {!isSpanish && (
          <p className="legal__notice" role="note">
            <i className="pi pi-globe" aria-hidden="true" />
            {t("legal:onlySpanish")}
          </p>
        )}
        <p className="credits__text credits__trademarks" lang="es">{TRADEMARKS_NOTICE_ES}</p>
      </section>
    </article>
  );
}
