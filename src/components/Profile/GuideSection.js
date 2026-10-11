import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { ProfileSection } from "../ProfileSection";
import { useOpenOnboarding } from "../Onboarding";

// Mi perfil, junto al idioma: volver a abrir la guía de bienvenida
export default function GuideSection() {
  const { t } = useTranslation("onboarding");
  const openGuide = useOpenOnboarding();

  return (
    <ProfileSection title={t("profile.title")} icon="pi-question-circle" className="profile-guide">
      <p className="gm-section__empty">{t("profile.text")}</p>
      <Button
        label={t("profile.open")}
        icon="pi pi-play"
        className="gm-btn gm-btn--ghost"
        onClick={openGuide}
      />
    </ProfileSection>
  );
}
