import { useTranslation } from "react-i18next";
import TwitchIcon from "./TwitchIcon";
import "./Twitch.css";

// "En vivo" en Twitch, en el morado de Twitch (#9146FF): verde = GamerMatch,
// azul = Steam, morado = Twitch. Prioriza el juego sobre el título del
// stream (más corto y es lo que importa aquí).
// live: { isLive, gameName, title }. className: variante según dónde va.
export default function TwitchLive({ live, className = "" }) {
  const { t } = useTranslation();

  if (!live?.isLive) return null;

  const detail = live.gameName || live.title;

  return (
    <span
      className={`twitch-live ${className}`.trim()}
      title={live.title ? t("presence.liveOnTwitchTitle", { title: live.title }) : t("presence.liveOnTwitch")}
    >
      <TwitchIcon className="twitch-live__icon" />
      <span className="twitch-live__text">
        {detail ? t("presence.liveWith", { detail }) : t("presence.live")}
      </span>
    </span>
  );
}
