import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AutoComplete } from "primereact/autocomplete";
import { RawgAttribution } from "../Credits";
import { useGameSearch } from "../../hooks";
import "../FavoriteGames/FavoriteGames.css";

const suggestionTemplate = (item) => (
  <div className="fav-games__suggestion">
    {item.image ? (
      <img src={item.image} alt="" className="fav-games__suggestion-img" />
    ) : (
      <span className="fav-games__suggestion-img" aria-hidden="true" />
    )}
    <span>{item.label}</span>
  </div>
);

// Filtro por juego del mapa (mismo buscador de RAWG que Juegos favoritos).
// game: { id, name } | null
export default function CommunityGameFilter({ game, onChange }) {
  const { t } = useTranslation("community");
  const [query, setQuery] = useState("");
  const { suggestions, handleSearch } = useGameSearch();

  if (game) {
    return (
      <div className="community-filter">
        <span className="community-filter__label">{t("filter.label")}</span>
        <button
          type="button"
          className="feed-chip feed-chip--active community-filter__chip"
          aria-label={t("filter.remove", { game: game.name })}
          onClick={() => onChange(null)}
        >
          {game.name}
          <i className="pi pi-times" aria-hidden="true" />
        </button>
        <button type="button" className="feed-chip community-filter__chip" onClick={() => onChange(null)}>
          {t("filter.all")}
        </button>
      </div>
    );
  }

  return (
    <div className="community-filter">
      <label className="community-filter__label" htmlFor="community-game">{t("filter.label")}</label>
      <AutoComplete
        inputId="community-game"
        value={query}
        suggestions={suggestions}
        completeMethod={handleSearch}
        onChange={(e) => setQuery(e.value)}
        onSelect={(e) => {
          setQuery("");
          onChange({ id: Number(e.value.id), name: e.value.value ?? e.value.label });
        }}
        field="label"
        itemTemplate={suggestionTemplate}
        placeholder={t("filter.placeholder")}
        className="gm-autocomplete community-filter__search"
        inputClassName="gm-input"
        panelClassName="gm-panel"
        panelFooterTemplate={<RawgAttribution className="data-source--panel" />}
      />
    </div>
  );
}
