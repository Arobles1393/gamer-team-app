import { useTranslation } from "react-i18next";
import SteamIcon from "./SteamIcon";
import { useSteamJoinInfo } from "../../hooks";

// Defensa en profundidad: solo un enlace joinlobby con números
const JOIN_URL = /^steam:\/\/joinlobby\/\d+\/\d+\/\d{17}$/;

// steam:// necesita el cliente de escritorio
const isTouchDevice = () =>
  navigator.userAgentData?.mobile === true || window.matchMedia?.("(pointer: coarse)").matches === true;

// "Unirme en Steam" a partir de la respuesta de getJoinInfo. No dibuja nada
// si no está disponible, en móvil/táctil o si el enlace no es válido.
export default function JoinSteamButton({ info, className = "" }) {
  const { t } = useTranslation();

  if (info?.available !== true || isTouchDevice()) return null;
  if (typeof info.joinUrl !== "string" || !JOIN_URL.test(info.joinUrl)) return null;

  return (
    <div className={`steam-join ${className}`.trim()}>
      <a href={info.joinUrl} rel="noopener noreferrer" className="steam-join__btn">
        <SteamIcon className="steam-join__icon" />
        <span className="steam-join__text">
          <span className="steam-join__label">{t("steamJoin.join")}</span>
          {info.gameName && (
            <span className="steam-join__game">{t("steamJoin.playing", { game: info.gameName })}</span>
          )}
        </span>
      </a>
      <p className="steam-join__help">{t("steamJoin.help")}</p>
    </div>
  );
}

// Consulta + botón, para usar en una pantalla centrada en UNA persona
// (nunca en listas: multiplicaría las llamadas)
export function JoinSteam({ targetUid, postId = null, enabled, className }) {
  const { info } = useSteamJoinInfo({ targetUid, postId, enabled });
  return <JoinSteamButton info={info} className={className} />;
}
