import { useTranslation } from "react-i18next";
import { AutoComplete } from "primereact/autocomplete";
import { RawgAttribution } from "../Credits";
import { Button } from "primereact/button";
import { ProfileSection } from "../ProfileSection";
import "./FavoriteGames.css";

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

/**
 * Juegos favoritos. En el perfil propio se editan (buscador de RAWG + quitar);
 * en el diálogo de otros jugadores solo se muestran.
 */
export default function FavoriteGames({
  games,
  isEditing = false,
  gameQuery = "",
  suggestions = [],
  onSearch,
  onGameQueryChange,
  onAddGame,
  onRemoveGame,
  emptyText,
  onEmptyAction
}) {
  const { t } = useTranslation("profile");
  const hasGames = games?.length > 0;

  return (
    <ProfileSection
      title={t("games.title")}
      icon="pi-star"
      className="fav-games"
      action={hasGames && <span className="fav-games__count">{games.length}</span>}
    >
      {isEditing && (
        <div className="gm-field fav-games__search">
          <AutoComplete
            value={gameQuery}
            suggestions={suggestions}
            completeMethod={onSearch}
            onChange={(e) => onGameQueryChange(e.value)}
            onSelect={(e) => onAddGame(e.value)}
            field="label"
            itemTemplate={suggestionTemplate}
            placeholder={t("games.searchPlaceholder")}
            aria-label={t("games.searchLabel")}
            className="gm-autocomplete"
            inputClassName="gm-input"
            panelClassName="gm-panel"
            panelFooterTemplate={<RawgAttribution className="data-source--panel" />}
          />
        </div>
      )}

      {hasGames ? (
        <ul className="fav-games__grid">
          {games.map((game) => (
            <li key={game.id} className="fav-game" title={game.name}>
              {game.image && <img src={game.image} alt="" loading="lazy" />}
              <span className="fav-game__name">{game.name}</span>

              {isEditing && (
                <button
                  type="button"
                  className="fav-game__remove"
                  aria-label={t("games.remove", { name: game.name })}
                  onClick={() => onRemoveGame(game.id)}
                >
                  <i className="pi pi-times" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !isEditing && (
          <div className="fav-games__empty">
            <p className="gm-section__empty">{emptyText ?? t("games.empty")}</p>
            {onEmptyAction && (
              <Button
                label={t("games.add")}
                icon="pi pi-plus"
                className="gm-btn gm-btn--ghost"
                onClick={onEmptyAction}
              />
            )}
          </div>
        )
      )}
    </ProfileSection>
  );
}
