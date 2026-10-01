import { useRef } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import { Dropdown } from "primereact/dropdown";
import { LANGUAGES, SKILL_LEVELS } from "../../constants";
import { EMPTY_TAG_FILTERS, hasTagFilters } from "../../utils";

const MIC_OPTIONS = [
  { label: "Con micrófono", value: true },
  { label: "Sin micrófono", value: false }
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
  const panelRef = useRef(null);
  const active = hasTagFilters(tagFilters);

  return (
    <>
      <button
        type="button"
        className={`feed-chip more-filters__trigger${active ? " feed-chip--active" : ""}`}
        aria-haspopup="dialog"
        aria-label={active ? "Más filtros (hay filtros activos)" : "Más filtros"}
        onClick={(event) => panelRef.current?.toggle(event)}
      >
        <i className="pi pi-filter" aria-hidden="true" />
        Más filtros
        {active && <span className="more-filters__dot" aria-hidden="true" />}
      </button>

      <OverlayPanel ref={panelRef} className="more-filters" aria-label="Más filtros">
        <ToggleGroup
          label="Micrófono"
          options={MIC_OPTIONS}
          value={tagFilters.mic}
          onChange={(mic) => onChange({ mic })}
        />
        <ToggleGroup
          label="Nivel"
          options={SKILL_LEVELS}
          value={tagFilters.skillLevel}
          onChange={(skillLevel) => onChange({ skillLevel })}
        />

        <div className="more-filters__group">
          <label className="more-filters__label" htmlFor="more-filters-language">Idioma</label>
          <Dropdown
            inputId="more-filters-language"
            value={tagFilters.language}
            options={LANGUAGES}
            onChange={(e) => onChange({ language: e.value ?? null })}
            optionLabel="label"
            optionValue="value"
            placeholder="Cualquiera"
            filter
            filterPlaceholder="Buscar idioma…"
            emptyFilterMessage="Ningún idioma coincide"
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
            Quitar estos filtros
          </button>
        )}
      </OverlayPanel>
    </>
  );
}
