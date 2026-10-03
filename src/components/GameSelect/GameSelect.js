import { useTranslation } from "react-i18next";
import { AutoComplete } from "primereact/autocomplete";
import { useGameSearch } from "../../hooks";
import { getPlatformKey, platformLabels } from "../../utils";
import "./GameSelect.css";

const suggestionTemplate = (item) => (
  <div className="game-select__suggestion">
    {item.image ? (
      <img src={item.image} alt="" className="game-select__suggestion-img" />
    ) : (
      <span className="game-select__suggestion-img" aria-hidden="true" />
    )}
    <span>{item.label}</span>
  </div>
);

// "PC · PS5 · XBOX" a partir de los nombres de plataforma de RAWG
const getAvailableLabel = (gamePlatforms) => {
  const keys = [...new Set((gamePlatforms ?? []).map(getPlatformKey).filter(Boolean))];
  return keys.map((key) => platformLabels[key]).join(" · ");
};

function SelectedGame({ name, image, gamePlatforms, locked, onClear }) {
  const { t } = useTranslation("posts");
  const available = getAvailableLabel(gamePlatforms);

  return (
    <div className="game-select__game">
      <span className="game-select__game-cover">
        {image && <img src={image} alt="" />}
      </span>
      <span className="game-select__game-info">
        <span className="game-select__game-name">{name}</span>
        <span className="game-select__game-meta">
          {locked
            ? t("create.gameLocked")
            : available
              ? t("create.gameAvailable", { platforms: available })
              : t("create.gameSelected")}
        </span>
      </span>
      {!locked && (
        <button
          type="button"
          className="game-select__game-clear"
          aria-label={t("create.changeGame")}
          onClick={onClear}
        >
          <i className="pi pi-times" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * Selector de juego con el buscador de RAWG (publicar partida, guías...).
 * - value: texto mientras se busca, o el juego elegido ({ value, image, platforms })
 * - lockedGame: { name, image, platforms } fijo (p. ej. al editar un post)
 */
export default function GameSelect({
  inputId,
  value,
  onChange,
  lockedGame = null,
  invalid = false,
  autoFocus = false,
  labelledBy
}) {
  const { t } = useTranslation("posts");
  const { suggestions, handleSearch } = useGameSearch();

  const selected = lockedGame
    ?? (typeof value === "object" && value?.value
      ? { name: value.value, image: value.image, platforms: value.platforms }
      : null);

  if (selected) {
    return (
      <SelectedGame
        name={selected.name}
        image={selected.image}
        gamePlatforms={selected.platforms}
        locked={Boolean(lockedGame)}
        onClear={() => onChange("")}
      />
    );
  }

  return (
    <AutoComplete
      inputId={inputId}
      value={value}
      suggestions={suggestions}
      completeMethod={handleSearch}
      onChange={(e) => onChange(e.value)}
      field="value"
      itemTemplate={suggestionTemplate}
      placeholder={t("create.gamePlaceholder")}
      aria-labelledby={labelledBy}
      className="gm-autocomplete"
      inputClassName={`gm-input${invalid ? " gm-input--invalid" : ""}`}
      panelClassName="gm-panel"
      autoFocus={autoFocus}
    />
  );
}
