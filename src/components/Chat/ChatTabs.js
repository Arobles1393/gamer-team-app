const TABS = [
  { value: "direct", label: "Chats" },
  { value: "group", label: "Chats de partida" }
];

// Pestañas de la lista de chats, con el estilo de los chips de filtro.
// unread: { direct: n, group: n } — conversaciones con mensajes sin leer
export default function ChatTabs({ tab, onTabChange, unread }) {
  return (
    <div className="chat-tabs" role="tablist" aria-label="Tipo de chat">
      {TABS.map(({ value, label }) => {
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
            {label}
            {count > 0 && (
              <span className="chat-tabs__badge" aria-label={`${count} sin leer`}>
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
