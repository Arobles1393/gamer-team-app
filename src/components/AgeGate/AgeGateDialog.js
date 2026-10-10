import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import "./AgeGate.css";

// "Confirma tu edad": no se puede cerrar sin responder. Las opciones son
// confirmar o cerrar sesión. Los enlaces legales abren en otra pestaña
// (allí el diálogo no se muestra: ver AgeGateProvider)
export default function AgeGateDialog({ visible, saving, error, onConfirm, onLogout }) {
  const { t } = useTranslation("auth");

  return (
    <Dialog
      visible={visible}
      onHide={() => {}}
      header={t("ageGate.title")}
      className="gm-dialog age-gate"
      maskClassName="gm-dialog-mask"
      modal
      closable={false}
      closeOnEscape={false}
      draggable={false}
      resizable={false}
    >
      <div className="age-gate__body">
        <span className="age-gate__icon" aria-hidden="true">
          <i className="pi pi-id-card" />
        </span>
        <p>{t("ageGate.text")}</p>
        <p className="age-gate__legal">
          <Trans
            t={t}
            i18nKey="ageGate.legal"
            components={{
              terms: <Link to="/terminos" target="_blank" rel="noopener noreferrer" />,
              privacy: <Link to="/privacidad" target="_blank" rel="noopener noreferrer" />
            }}
          />
        </p>
        {error && <p className="age-gate__error" role="alert">{t("ageGate.saveError")}</p>}
      </div>
      <div className="age-gate__actions">
        <Button
          type="button"
          label={t("ageGate.logout")}
          className="gm-btn gm-btn--ghost"
          disabled={saving}
          onClick={onLogout}
        />
        <Button
          type="button"
          label={t("ageGate.confirm")}
          className="gm-btn gm-btn--primary"
          loading={saving}
          onClick={onConfirm}
        />
      </div>
    </Dialog>
  );
}
