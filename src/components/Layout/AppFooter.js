import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { LegalLinks } from "../Legal";
import { RAWG_URL } from "../../credits/credits";
import "./AppFooter.css";

/**
 * Pie global: atribución de RAWG (su plan gratuito exige un enlace activo
 * en cada página que use sus datos), créditos, legales y año.
 */
export default function AppFooter({ className = "" }) {
  const { t } = useTranslation("credits");

  return (
    <footer className={`app-footer ${className}`.trim()}>
      <p className="app-footer__row">
        <span>
          {t("footer.gameData")}{" "}
          {/* Solo noopener: RAWG pide "un enlace activo"; con noreferrer,
              nofollow o sponsored parecería un enlace de baja confianza.
              noopener ya impide que la pestaña nueva acceda a esta. */}
          {/* eslint-disable-next-line react/jsx-no-target-blank */}
          <a href={RAWG_URL} target="_blank" rel="noopener">
            RAWG
          </a>
        </span>
        <span aria-hidden="true">·</span>
        <Link to="/creditos">{t("footer.credits")}</Link>
      </p>
      <LegalLinks className="app-footer__legal" />
      <p className="app-footer__copy">{t("footer.copyright", { year: new Date().getFullYear() })}</p>
    </footer>
  );
}
