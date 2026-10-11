import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { ProfileSection } from "../ProfileSection";
import DeleteAccountDialog from "./DeleteAccountDialog";

// Final de Mi perfil: eliminar la cuenta
export default function DangerZone({ user, username, onError }) {
  const { t } = useTranslation("profile");
  const [open, setOpen] = useState(false);

  return (
    <ProfileSection title={t("danger.title")} icon="pi-exclamation-triangle" className="danger-zone">
      <p className="danger-zone__text">{t("danger.text")}</p>
      <Button
        label={t("danger.delete")}
        icon="pi pi-trash"
        className="gm-btn gm-btn--danger"
        onClick={() => setOpen(true)}
      />
      <DeleteAccountDialog
        visible={open}
        onHide={() => setOpen(false)}
        user={user}
        username={username}
        onError={onError}
      />
    </ProfileSection>
  );
}
