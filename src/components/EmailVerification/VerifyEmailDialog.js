import { useTranslation } from "react-i18next";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useCurrentUser } from "../../context";
import { useVerifyPrompt } from "../../context/VerifyPromptContext";
import "./EmailVerification.css";

// Se abre al intentar una acción social sin haber verificado el correo
// (useRequireVerified)
export default function VerifyEmailDialog() {
  const { t } = useTranslation("auth");
  const user = useCurrentUser();
  const { promptVisible, closePrompt, resend, sending, cooldown, check, checking } = useVerifyPrompt();

  return (
    <Dialog
      visible={promptVisible}
      onHide={closePrompt}
      header={t("verify.dialogTitle")}
      className="gm-dialog verify-dialog"
      modal
      dismissableMask
      draggable={false}
      resizable={false}
    >
      <div className="verify-dialog__body">
        <span className="verify-dialog__icon" aria-hidden="true">
          <i className="pi pi-envelope" />
        </span>
        <p>{t("verify.dialogText", { email: user?.email })}</p>
        <p className="verify-dialog__hint">{t("verify.dialogHint")}</p>
      </div>
      <div className="verify-dialog__actions">
        <Button
          label={cooldown > 0 ? t("verify.resendIn", { count: cooldown }) : t("verify.resend")}
          icon="pi pi-send"
          className="gm-btn gm-btn--ghost"
          loading={sending}
          disabled={cooldown > 0}
          onClick={resend}
        />
        <Button
          label={t("verify.check")}
          icon="pi pi-check"
          className="gm-btn gm-btn--primary"
          loading={checking}
          onClick={() => check()}
        />
      </div>
    </Dialog>
  );
}
