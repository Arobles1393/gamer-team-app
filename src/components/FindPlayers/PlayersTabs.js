import { useTranslation } from "react-i18next";

export const PLAYER_TABS = ["search", "compatible"];

// Pestañas de Buscar jugadores, con el mismo estilo que las de Chats
export default function PlayersTabs({ tab, onTabChange }) {
  const { t } = useTranslation("matching");

  return (
    <div className="players-tabs" role="tablist" aria-label={t("tabs.label")}>
      {PLAYER_TABS.map((value) => {
        const active = tab === value;

        return (
          <button
            key={value}
            type="button"
            role="tab"
            id={`players-tab-${value}`}
            aria-selected={active}
            aria-controls="players-panel"
            className={`feed-chip players-tabs__tab${active ? " feed-chip--active" : ""}`}
            onClick={() => onTabChange(value)}
          >
            <i className={`pi ${value === "search" ? "pi-search" : "pi-bolt"}`} aria-hidden="true" />
            {t(`tabs.${value}`)}
          </button>
        );
      })}
    </div>
  );
}
