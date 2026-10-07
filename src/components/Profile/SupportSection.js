import { useTranslation } from "react-i18next";
import { ProfileSection } from "../ProfileSection";
import { SupportButton } from "../Support";
import { getSupportUrl } from "../../utils/supportUrl";

// Mi perfil, antes de la zona de peligro. Sin enlace configurado no se muestra
export default function SupportSection() {
  const { t } = useTranslation("support");
  if (!getSupportUrl()) return null;

  return (
    <ProfileSection title={t("card.title")} icon="pi-heart" className="profile-support">
      <SupportButton variant="card" />
    </ProfileSection>
  );
}
