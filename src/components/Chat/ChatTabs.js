import { useTranslation } from "react-i18next";

const TABS = [
  { value: "direct", labelKey: "list.tabDirect" },
  { value: "group", labelKey: "list.tabGroup" }
];

// Pestañas de la lista de chats, con el estilo de los chips de filtro.
// unread: { direct: n, group: n } — conversaciones con mensajes sin leer
export default function ChatTabs({ tab, onTabChange, unread }) {
  const { t } = useTranslation("chat");

  return (
    <div className="chat-tabs" role="tablist" aria-label={t("list.tabsLabel")}>
      {TABS.map(({ value, labelKey }) => {
        const active = tab === value;
        const count = unread[value] || 0;

        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`feed-chip chat-tabs__tab${active ? " feed-chip--active" : ""}`}
            onClick={() => onTabChange(value)}
          >
            {t(labelKey)}
            {count > 0 && (
              <span className="chat-tabs__badge" aria-label={t("list.unreadBadge", { count })}>
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
