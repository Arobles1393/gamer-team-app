import { useLayoutEffect, useMemo, useRef } from "react";
import { Skeleton } from "primereact/skeleton";
import ChatEmptyState from "./ChatEmptyState";
import MessageBubble from "./MessageBubble";
import { formatDates } from "../../utils";

// Mensajes seguidos del mismo autor con menos de 5 min entre sí van en el mismo grupo
const GROUP_WINDOW_MS = 5 * 60 * 1000;
// Si el usuario está a menos de esto del final, los mensajes nuevos lo mantienen abajo
const STICK_THRESHOLD_PX = 120;

const getDayLabel = (date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === yesterday.toDateString()) return "Ayer";

  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
};

const formatTime = (date) =>
  date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

// Convierte la lista plana en separadores de día y grupos por autor
const buildTimeline = (messages, currentUserId) => {
  const timeline = [];
  let lastDay = null;
  let group = null;

  messages.forEach((message) => {
    const date = formatDates.toDate(message.createdAt) ?? new Date();
    const day = date.toDateString();
    const mine = message.senderId === currentUserId;

    if (day !== lastDay) {
      timeline.push({ type: "day", key: `day-${day}`, label: getDayLabel(date) });
      lastDay = day;
      group = null;
    }

    const continuesGroup =
      group &&
      group.senderId === message.senderId &&
      date - group.lastDate < GROUP_WINDOW_MS;

    if (!continuesGroup) {
      group = { type: "group", key: message.id, senderId: message.senderId, mine, messages: [] };
      timeline.push(group);
    }

    group.messages.push(message);
    group.lastDate = date;
  });

  return timeline;
};

function MessagesSkeleton() {
  const widths = ["45%", "30%", "60%", "38%", "52%"];

  return (
    <div className="chat-messages__skeleton" aria-hidden="true">
      {widths.map((width, i) => (
        <Skeleton
          key={i}
          width={width}
          height="40px"
          borderRadius="18px"
          className={`feed-skeleton${i % 2 ? " chat-messages__skeleton--mine" : ""}`}
        />
      ))}
    </div>
  );
}

// senderProfiles (opcional, chat de grupo): { uid: perfil } para mostrar
// quién escribió cada bloque de mensajes ajenos
export default function MessageList({ messages, loading, currentUserId, otherUsername, senderProfiles }) {
  const containerRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const hasScrolledRef = useRef(false);

  const timeline = useMemo(
    () => buildTimeline(messages, currentUserId),
    [messages, currentUserId]
  );

  const handleScroll = () => {
    const el = containerRef.current;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
  };

  // Baja al último mensaje: al abrir el chat, al enviar, o si ya estabas abajo
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (stickToBottomRef.current || lastMessage.senderId === currentUserId) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: hasScrolledRef.current ? "smooth" : "auto"
      });
      hasScrolledRef.current = true;
    }
  }, [messages, currentUserId]);

  if (loading) {
    return (
      <div className="chat-messages" aria-busy="true" aria-label="Cargando mensajes">
        <MessagesSkeleton />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="chat-messages chat-messages--empty">
        <ChatEmptyState variant="noMessages" detail={otherUsername || ""} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="chat-messages"
      role="log"
      aria-live="polite"
      aria-label="Mensajes"
      onScroll={handleScroll}
    >
      {timeline.map((item) =>
        item.type === "day" ? (
          <p key={item.key} className="chat-day">{item.label}</p>
        ) : (
          <div
            key={item.key}
            className={`chat-group${item.mine ? " chat-group--mine" : ""}`}
          >
            {senderProfiles && !item.mine && (
              <span className="chat-group__sender">
                {senderProfiles[item.senderId]?.username || "Jugador"}
              </span>
            )}
            {item.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <span className="chat-group__time">{formatTime(item.lastDate)}</span>
          </div>
        )
      )}
    </div>
  );
}
