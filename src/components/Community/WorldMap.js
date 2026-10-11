import { memo, useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldMap from "../../data/worldMap.json";

// Natural Earth 110m (world-atlas) con el código ISO alpha-2 en
// properties.code, servido desde el bundle (sin CDN ni API key).
// Se carga en un chunk aparte (React.lazy en CommunityPage).
const WIDTH = 960;
const HEIGHT = 500;

const geographies = feature(worldMap, worldMap.objects.countries).features
  // La Antártida ocupa mucho y nadie juega desde ahí
  .filter((geo) => geo.properties.name !== "Antarctica");

const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "FeatureCollection", features: geographies });
const pathOf = geoPath(projection);

const shapes = geographies.map((geo) => ({
  code: geo.properties.code,
  d: pathOf(geo),
  centroid: pathOf.centroid(geo)
}));

// Violeta proporcional a la actividad; los enmascarados, tinte tenue fijo
const fillFor = (country, maxCount) => {
  if (!country) return undefined;
  if (country.masked) return "rgba(124, 58, 237, 0.28)";
  const intensity = maxCount > 0 ? country.count / maxCount : 0;
  return `rgba(124, 58, 237, ${(0.4 + 0.6 * intensity).toFixed(2)})`;
};

/**
 * Mapa de actividad por país. Es decorativo para lectores de pantalla
 * (aria-hidden): la lista de países es la interfaz accesible equivalente.
 * countries: { [ISO]: { count } | { count: null, masked: true } }
 */
function WorldMap({ countries, selectedCode, onSelect }) {
  const maxCount = useMemo(
    () => Math.max(0, ...Object.values(countries).map((country) => country.count ?? 0)),
    [countries]
  );

  return (
    <svg
      className="world-map"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {shapes.map(({ code, d }, index) => {
        const country = code ? countries[code] : null;
        const classes = [
          "world-map__country",
          country && "world-map__country--active",
          country?.masked && "world-map__country--masked",
          code && code === selectedCode && "world-map__country--selected"
        ].filter(Boolean).join(" ");

        return (
          <path
            key={code ?? `x${index}`}
            d={d}
            className={classes}
            style={{ fill: fillFor(country, maxCount) }}
            data-code={code ?? undefined}
            onClick={country ? () => onSelect(code) : undefined}
          />
        );
      })}

      {/* Punto en los países con número visible (no en los enmascarados) */}
      {shapes
        .filter(({ code }) => code && countries[code]?.count)
        .map(({ code, centroid }) => (
          <g key={`dot-${code}`} className="world-map__dot" transform={`translate(${centroid[0]} ${centroid[1]})`}>
            <circle className="world-map__pulse" r="6" />
            <circle className="world-map__core" r="3" />
          </g>
        ))}
    </svg>
  );
}

export default memo(WorldMap);
