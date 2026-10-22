import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { ProfileSection } from "../ProfileSection";
import {
  isNotificationSoundEnabled,
  previewNotificationSound,
  setNotificationSoundEnabled,
  subscribeToNotificationSound
} from "../../utils/notificationSound";

// Mi perfil (fuera del modo edición): sonido al llegar una notificación.
// Se guarda al momento en este navegador. Los botones dejan escuchar cada
// sonido aunque esté apagado.
export default function NotificationSoundSection() {
  const { t } = useTranslation("profile");
  const [enabled, setEnabled] = useState(isNotificationSoundEnabled);

  useEffect(() => subscribeToNotificationSound(setEnabled), []);

  return (
    <ProfileSection title={t("sound.title")} icon="pi-volume-up" className="profile-privacy profile-sound">
      <div className="profile-privacy__row">
        <label htmlFor="notification-sound" className="profile-privacy__label">
          {t("sound.label")}
        </label>
        <InputSwitch
          inputId="notification-sound"
          checked={enabled}
          onChange={(e) => setNotificationSoundEnabled(e.value)}
          aria-describedby="notification-sound-help"
        />
      </div>

      <p id="notification-sound-help" className="profile-sound__hint">
        {t("sound.hint")}
      </p>

      <div className="profile-sound__previews">
        <Button
          type="button"
          icon="pi pi-comments"
          label={t("sound.previewMessage")}
          className="gm-btn gm-btn--ghost"
          onClick={() => previewNotificationSound("message")}
        />
        <Button
          type="button"
          icon="pi pi-bell"
          label={t("sound.previewDefault")}
          className="gm-btn gm-btn--ghost"
          onClick={() => previewNotificationSound("default")}
        />
      </div>
    </ProfileSection>
  );
}
