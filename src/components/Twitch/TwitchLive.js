import TwitchIcon from "./TwitchIcon";
import "./Twitch.css";

// "En vivo" en Twitch, en el morado de Twitch (#9146FF): verde = GamerMatch,
// azul = Steam, morado = Twitch. Prioriza el juego sobre el título del
// stream (más corto y es lo que importa aquí).
// live: { isLive, gameName, title }. className: variante según dónde va.
export default function TwitchLive({ live, className = "" }) {
  if (!live?.isLive) return null;

  const detail = live.gameName || live.title;

  return (
    <span
      className={`twitch-live ${className}`.trim()}
      title={live.title ? `En vivo en Twitch: ${live.title}` : "En vivo en Twitch"}
    >
      <TwitchIcon className="twitch-live__icon" />
      <span className="twitch-live__text">
        En vivo{detail ? `: ${detail}` : ""}
      </span>
    </span>
  );
}
