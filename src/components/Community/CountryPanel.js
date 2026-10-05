import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { buildExploreUrl, getCountryByCode, getCountryLabelByCode } from "../../utils";
import { useCountText } from "./CountryRankList";

// País elegido (desde el mapa o la lista): nombre, conteo y acceso a sus
// partidas recientes en /explorar
export default function CountryPanel({ code, country, minCount, onClose }) {
  const { t } = useTranslation("community");
  const navigate = useNavigate();
  const countText = useCountText();
  const name = getCountryLabelByCode(code);

  return (
    <section className="country-panel" aria-label={t("panel.label")} aria-live="polite">
      <div className="country-panel__info">
        <span className="country-panel__flag" aria-hidden="true">{getCountryByCode(code)?.flag}</span>
        <div>
          <h2 className="country-panel__name">{name}</h2>
          <p className={`country-panel__count${country.masked ? " country-panel__count--masked" : ""}`}>
            {countText(country, minCount)}
          </p>
        </div>
      </div>

      <div className="country-panel__actions">
        <Button
          label={t("panel.viewPosts", { country: name })}
          icon="pi pi-arrow-right"
          iconPos="right"
          className="gm-btn gm-btn--primary"
          onClick={() => navigate(buildExploreUrl({ category: "recent", region: code }))}
        />
        <Button
          icon="pi pi-times"
          className="gm-btn gm-btn--ghost country-panel__close"
          aria-label={t("panel.close")}
          onClick={onClose}
        />
      </div>
    </section>
  );
}
