import { memo } from "react";
import { useTranslation } from "react-i18next";
import { getCountryByCode, getCountryLabelByCode } from "../../utils";

// Texto del conteo de un país: número exacto o "menos de 5"
export const useCountText = () => {
  const { t } = useTranslation("community");
  return (country, minCount) =>
    country.masked
      ? t("list.masked", { count: minCount })
      : t("list.players", { count: country.count });
};

// Primero los de número visible (de más a menos), luego los enmascarados
// por nombre: en esos no se sabe cuál tiene más
export const sortCountries = (countries) =>
  Object.entries(countries)
    .map(([code, country]) => ({ code, ...country, label: getCountryLabelByCode(code) }))
    .sort((a, b) => {
      if (a.masked !== b.masked) return a.masked ? 1 : -1;
      if (!a.masked && b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });

/**
 * Países ordenados por actividad. Cada fila es un botón que selecciona el
 * mismo país que el mapa: es la vista accesible (y la principal en
 * pantallas chicas).
 */
function CountryRankList({ rows, minCount, selectedCode, onSelect }) {
  const { t } = useTranslation("community");
  const countText = useCountText();

  return (
    <ol className="country-rank" aria-label={t("list.label")}>
      {rows.map((row, index) => {
        const selected = row.code === selectedCode;

        return (
          <li key={row.code}>
            <button
              type="button"
              className={`country-rank__row${selected ? " country-rank__row--selected" : ""}`}
              aria-pressed={selected}
              data-code={row.code}
              onClick={() => onSelect(row.code)}
            >
              <span className="country-rank__position" aria-hidden="true">
                {row.masked ? "·" : index + 1}
              </span>
              <span className="country-rank__flag" aria-hidden="true">{getCountryByCode(row.code)?.flag}</span>
              <span className="country-rank__name">{row.label}</span>
              <span className={`country-rank__count${row.masked ? " country-rank__count--masked" : ""}`}>
                {countText(row, minCount)}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export default memo(CountryRankList);
