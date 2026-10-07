import { useTranslation } from "react-i18next";
import { InputSwitch } from "primereact/inputswitch";
import { ProfileSection } from "../ProfileSection";
import { usePrivacySettings } from "../../hooks";
import { getSteamIdFromLinks } from "../../utils";

// Mi perfil (fuera del modo edición): "Unirme en Steam". Se guarda al
// momento. Sin enlace de Steam en las redes no se puede activar.
export default function PrivacySection({ user, links, onError }) {
  const { t } = useTranslation("profile");
  const hasSteam = Boolean(getSteamIdFromLinks(links));
  const { allowSteamJoin, loading, saving, setAllowSteamJoin } = usePrivacySettings(
    user,
    () => onError?.(t("privacy.saveError"))
  );

  return (
    <ProfileSection title={t("privacy.title")} icon="pi-lock" className="profile-privacy">
      <div className="profile-privacy__row">
        <label htmlFor="privacy-steam-join" className="profile-privacy__label">
          {t("privacy.steamJoin")}
        </label>
        <InputSwitch
          inputId="privacy-steam-join"
          checked={hasSteam && allowSteamJoin}
          onChange={(e) => setAllowSteamJoin(e.value)}
          disabled={!hasSteam || loading || saving}
          aria-describedby="privacy-steam-join-help"
        />
      </div>

      {!hasSteam && (
        <p className="profile-privacy__notice" role="note">
          <i className="pi pi-link" aria-hidden="true" />
          {t("privacy.needsSteam")}
        </p>
      )}

      <ul id="privacy-steam-join-help" className="profile-privacy__help">
        <li>{t("privacy.help.shared")}</li>
        <li>{t("privacy.help.who")}</li>
        <li>{t("privacy.help.noIp")}</li>
        <li>{t("privacy.help.turnOff")}</li>
      </ul>
    </ProfileSection>
  );
}
