import { useTranslation } from "react-i18next";

// Contenido del botón "Quiero jugar" justo después de unirse: check que se
// dibuja y "¡Dentro!" (estilos en src/styles/motion.css)
export default function JoinedLabel() {
  const { t } = useTranslation("posts");

  return (
    <span className="gm-joined">
      <svg className="gm-joined__check" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      {t("card.joined")}
    </span>
  );
}
