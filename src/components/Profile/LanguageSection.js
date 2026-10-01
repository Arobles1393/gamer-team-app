import { useTranslation } from "react-i18next";
import { Dropdown } from "primereact/dropdown";
import { ProfileSection } from "../ProfileSection";
import { profileService } from "../../services/profile";
import { APP_LANGUAGES, getAppLanguage, setAppLanguage } from "../../i18n";

// Idioma de la interfaz. Siempre visible (no depende de Editar perfil): se
// aplica al momento, queda en localStorage para este navegador y se guarda en
// users/{uid}.language para aplicarlo al iniciar sesión en otro dispositivo.
// Los nombres van en su propio idioma ("English", "Français"…), sin traducir.
export default function LanguageSection({ user, onError }) {
  const { t, i18n } = useTranslation("profile");
  // resolvedLanguage hace que el valor se actualice al cambiar de idioma
  const current = i18n.resolvedLanguage && getAppLanguage();

  const handleChange = async (code) => {
    if (!code || code === current) return;

    setAppLanguage(code);

    try {
      await profileService.updateUserLanguage(user.uid, code);
    } catch (error) {
      console.error("Error al guardar el idioma:", error);
      onError?.(t("language.saveError"));
    }
  };

  return (
    <ProfileSection title={t("language.title")} icon="pi-language" className="profile-language">
      <div className="gm-field">
        <label className="gm-field__label" htmlFor="profile-language">
          {t("language.label")}
        </label>
        <Dropdown
          inputId="profile-language"
          value={current}
          options={APP_LANGUAGES}
          optionLabel="name"
          optionValue="code"
          onChange={(e) => handleChange(e.value)}
          className="gm-select"
          panelClassName="gm-panel"
        />
        <p className="gm-field__hint">{t("language.hint")}</p>
      </div>
    </ProfileSection>
  );
}
