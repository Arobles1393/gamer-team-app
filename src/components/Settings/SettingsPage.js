import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { useCurrentUser, useCurrentUserData } from "../../context";
import LanguageSection from "./LanguageSection";
import NotificationSoundSection from "./NotificationSoundSection";
import PrivacySection from "./PrivacySection";
import BlockedUsers from "./BlockedUsers";
import SupportSection from "./SupportSection";
import DangerZone from "./DangerZone";
import "../Posts/Feed.css";
import "./Settings.css";

// Configuración: lo que cambia cómo funciona la app para ti. Todo se guarda
// al momento (sin modo edición). Lo que ven los demás, y el correo, siguen en
// Mi perfil.
export default function SettingsPage() {
  const { t } = useTranslation("profile");
  const user = useCurrentUser();
  const userData = useCurrentUserData();
  const toast = useRef(null);

  const showError = useCallback((detail) => {
    toast.current?.show({ severity: "error", summary: t("common:status.error"), detail, life: 3000 });
  }, [t]);

  return (
    <div className="feed settings-page">
      <header className="feed-header">
        <div className="feed-header__titles">
          <span className="feed-header__eyebrow">{t("settings.eyebrow")}</span>
          <h1 className="feed-header__title">{t("settings.title")}</h1>
        </div>
      </header>

      {userData ? (
        <div className="settings-page__sections">
          <LanguageSection user={user} onError={showError} />
          {/* Sonido de notificaciones: se guarda en este navegador */}
          <NotificationSoundSection />
          {/* Usa los links guardados en Mi perfil */}
          <PrivacySection user={user} links={userData.links} onError={showError} />
          {/* Solo aparece si bloqueaste a alguien */}
          <BlockedUsers user={user} onError={showError} />
          {/* Solo con enlace de apoyo configurado */}
          <SupportSection />
          <DangerZone user={user} username={userData.username} onError={showError} />
        </div>
      ) : (
        <div className="settings-page__sections" aria-busy="true" aria-label={t("settings.loading")}>
          <Skeleton height="140px" borderRadius="16px" />
          <Skeleton height="140px" borderRadius="16px" />
          <Skeleton height="140px" borderRadius="16px" />
        </div>
      )}

      <Toast ref={toast} />
    </div>
  );
}
