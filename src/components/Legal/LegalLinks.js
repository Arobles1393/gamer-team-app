import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "./Legal.css";

// Enlaces discretos a Privacidad y Términos (login, registro y Mi perfil)
export default function LegalLinks({ className = "" }) {
  const { t } = useTranslation("legal");

  return (
    <nav className={`legal-links ${className}`.trim()} aria-label={t("linksLabel")}>
      <Link to="/privacidad">{t("links.privacy")}</Link>
      <span aria-hidden="true">·</span>
      <Link to="/terminos">{t("links.terms")}</Link>
    </nav>
  );
}
