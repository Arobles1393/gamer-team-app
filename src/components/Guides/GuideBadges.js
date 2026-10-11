import { useTranslation } from "react-i18next";

const TYPE_ICONS = { original: "pi-book", external: "pi-external-link" };
const STATUS_ICONS = { pending: "pi-clock", approved: "pi-check", rejected: "pi-times" };

// "Guía" o "Enlace externo"
export function GuideTypeBadge({ type }) {
  const { t } = useTranslation("guides");

  return (
    <span className={`guide-badge guide-badge--${type}`}>
      <i className={`pi ${TYPE_ICONS[type]}`} aria-hidden="true" />
      {t(`badge.${type}`)}
    </span>
  );
}

// Pendiente / Aprobada / Rechazada (Mis guías y el detalle para su autor)
export function GuideStatusBadge({ status }) {
  const { t } = useTranslation("guides");

  return (
    <span className={`guide-status guide-status--${status}`}>
      <i className={`pi ${STATUS_ICONS[status]}`} aria-hidden="true" />
      {t(`status.${status}`)}
    </span>
  );
}
