import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";

// Aviso para perfiles sin región (p. ej. creados con Google, que no la provee)
export default function ProfileNudge() {
  const { t } = useTranslation("posts");
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  return (
    <div className="profile-nudge" role="status">
      <i className="pi pi-map-marker profile-nudge__icon" aria-hidden="true" />
      <p className="profile-nudge__text">
        {t("nudge.text")}
      </p>
      <Button
        label={t("nudge.cta")}
        className="gm-btn gm-btn--ghost profile-nudge__cta"
        onClick={() => navigate("/profile")}
      />
      <Button
        icon="pi pi-times"
        text
        rounded
        className="profile-nudge__close"
        aria-label={t("nudge.close")}
        onClick={() => setDismissed(true)}
      />
    </div>
  );
}
