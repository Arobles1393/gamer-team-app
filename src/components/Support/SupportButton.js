import { useTranslation } from "react-i18next";
import { getSupportUrl } from "../../utils/supportUrl";
import "./Support.css";

/**
 * "Apoyar el proyecto": enlace saliente a Ko-fi en una pestaña nueva, sin
 * acceso a esta ventana (noopener) ni Referer (noreferrer). Si
 * REACT_APP_SUPPORT_URL no es válida, no se muestra.
 * variant: "button" (por defecto) | "link" | "card" (con la explicación).
 */
export default function SupportButton({ variant = "button", className = "" }) {
  const { t } = useTranslation("support");
  const url = getSupportUrl();
  if (!url) return null;

  const link = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`support-btn${variant === "link" ? " support-btn--link" : ""}${variant === "card" ? "" : ` ${className}`}`.trim()}
    >
      <i className="pi pi-heart" aria-hidden="true" />
      <span>{t("button")}</span>
      <span className="sr-only">{t("newTab")}</span>
    </a>
  );

  if (variant !== "card") return link;

  return (
    <div className={`support-card ${className}`.trim()}>
      <p className="support-card__text">{t("card.text")}</p>
      {link}
      <p className="support-card__note">{t("card.payment")}</p>
    </div>
  );
}
