import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";

// Barra fija al fondo mientras se edita: Guardar siempre queda a la mano
export default function ProfileSaveBar({ hasChanges, saving, onCancel, onSave }) {
  const { t } = useTranslation("profile");

  return (
    <div className="profile-savebar" role="region" aria-label={t("saveBar.label")}>
      <span className="profile-savebar__text">
        <i
          className={`pi ${hasChanges ? "pi-circle-fill profile-savebar__dot" : "pi-info-circle"}`}
          aria-hidden="true"
        />
        {hasChanges ? t("saveBar.unsaved") : t("saveBar.noChanges")}
      </span>

      <div className="profile-savebar__actions">
        <Button
          label={t("common:actions.cancel")}
          className="gm-btn gm-btn--ghost"
          onClick={onCancel}
          disabled={saving}
        />
        <Button
          label={t("saveBar.save")}
          icon="pi pi-check"
          className="gm-btn gm-btn--primary"
          onClick={onSave}
          loading={saving}
          disabled={!hasChanges}
        />
      </div>
    </div>
  );
}
