import { useTranslation } from "react-i18next";
import { RAWG_URL } from "../../credits/credits";
import "./Credits.css";

/**
 * "Con tecnología de RAWG" en el panel de sugerencias de los buscadores de
 * juegos (panelFooterTemplate del AutoComplete): ahí se muestran datos de
 * RAWG, que exige un enlace activo.
 */
export default function RawgAttribution({ className = "" }) {
  const { t } = useTranslation("credits");

  return (
    <p className={`data-source ${className}`.trim()}>
      {t("poweredBy")}{" "}
      {/* Solo noopener, como en el pie: RAWG pide un enlace activo */}
      {/* eslint-disable-next-line react/jsx-no-target-blank */}
      <a href={RAWG_URL} target="_blank" rel="noopener">
        RAWG
      </a>
    </p>
  );
}
