import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CONTACT_MAILTO } from "../../config/contact";
import "./Legal.css";

// Enlaces discretos a Privacidad y Términos (login, registro y Mi perfil).
// showContact: también "Contacto" (mailto:), en el pie global
export default function LegalLinks({ className = "", showContact = false }) {
  const { t } = useTranslation("legal");

  return (
    <nav className={`legal-links ${className}`.trim()} aria-label={t("linksLabel")}>
      <Link to="/privacidad">{t("links.privacy")}</Link>
      <span aria-hidden="true">·</span>
      <Link to="/terminos">{t("links.terms")}</Link>
      {showContact && (
        <>
          <span aria-hidden="true">·</span>
          <a href={CONTACT_MAILTO}>{t("links.contact")}</a>
        </>
      )}
    </nav>
  );
}
