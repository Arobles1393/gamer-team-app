import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { OverlayPanel } from "primereact/overlaypanel";
import { Dropdown } from "primereact/dropdown";
import { SKILL_LEVELS, getLanguageOptions } from "../../constants";
import { EMPTY_TAG_FILTERS, hasTagFilters } from "../../utils";

const MIC_OPTIONS = [
  { labelKey: "moreFilters.withMic", value: true },
  { labelKey: "moreFilters.withoutMic", value: false }
];

// Opciones excluyentes que se pueden deseleccionar (clic en la activa = cualquiera)
function ToggleGroup({ label, options, value, onChange }) {
  return (
    <div className="more-filters__group" role="group" aria-label={label}>
      <span className="more-filters__label">{label}</span>
      <div className="more-filters__options">
        {options.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={String(option.value)}
              type="button"
              className={`feed-chip more-filters__option${active ? " feed-chip--active" : ""}`}
              aria-pressed={active}
              onClick={() => onChange(active ? null : option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Botón "Más filtros" + panel con micrófono, nivel e idioma. Un punto en el
// botón avisa que hay filtros de este panel activos aunque esté cerrado.
export default function MoreFiltersPanel({ tagFilters = EMPTY_TAG_FILTERS, onChange }) {
  const { t, i18n } = useTranslation("posts");
  const panelRef = useRef(null);
  const active = hasTagFilters(tagFilters);

  const micOptions = MIC_OPTIONS.map(({ labelKey, value }) => ({ label: t(labelKey), value }));
  const levelOptions = SKILL_LEVELS.map(({ value }) => ({ label: t(`skill.${value}`), value }));
  // Nombres de idioma en el idioma de la interfaz
  const languageOptions = useMemo(() => getLanguageOptions(), [i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <button
        type="button"
        className={`feed-chip more-filters__trigger${active ? " feed-chip--active" : ""}`}
        aria-haspopup="dialog"
        aria-label={active ? t("moreFilters.buttonActive") : t("moreFilters.button")}
        onClick={(event) => panelRef.current?.toggle(event)}
      >
        <i className="pi pi-filter" aria-hidden="true" />
        {t("moreFilters.button")}
        {active && <span className="more-filters__dot" aria-hidden="true" />}
      </button>

      <OverlayPanel ref={panelRef} className="more-filters" aria-label={t("moreFilters.button")}>
        <ToggleGroup
          label={t("moreFilters.mic")}
          options={micOptions}
          value={tagFilters.mic}
          onChange={(mic) => onChange({ mic })}
        />
        <ToggleGroup
          label={t("moreFilters.level")}
          options={levelOptions}
          value={tagFilters.skillLevel}
          onChange={(skillLevel) => onChange({ skillLevel })}
        />

        <div className="more-filters__group">
          <label className="more-filters__label" htmlFor="more-filters-language">{t("moreFilters.language")}</label>
          <Dropdown
            inputId="more-filters-language"
            value={tagFilters.language}
            options={languageOptions}
            onChange={(e) => onChange({ language: e.value ?? null })}
            optionLabel="label"
            optionValue="value"
            placeholder={t("moreFilters.anyLanguage")}
            filter
            filterPlaceholder={t("moreFilters.searchLanguage")}
            emptyFilterMessage={t("moreFilters.noLanguage")}
            showClear
            className="more-filters__select"
            panelClassName="feed-select-panel"
          />
        </div>

        {active && (
          <button
            type="button"
            className="more-filters__clear"
            onClick={() => onChange(EMPTY_TAG_FILTERS)}
          >
            {t("moreFilters.clear")}
          </button>
        )}
      </OverlayPanel>
    </>
  );
}
