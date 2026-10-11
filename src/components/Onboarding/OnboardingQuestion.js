import { useTranslation } from "react-i18next";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import "./Onboarding.css";

// Al terminar o saltar la guía: "¿Quieres que esta guía vuelva a aparecer?"
// onAnswer(true | false); onDismiss: cerrada sin responder
export default function OnboardingQuestion({ visible, saving, onAnswer, onDismiss }) {
  const { t } = useTranslation("onboarding");

  return (
    <Dialog
      visible={visible}
      onHide={() => {
        if (!saving) onDismiss();
      }}
      header={t("question.title")}
      className="gm-dialog onboarding-question"
      maskClassName="gm-dialog-mask"
      modal
      draggable={false}
      resizable={false}
      closable={!saving}
    >
      <p className="onboarding-question__text">{t("question.text")}</p>
      <div className="onboarding-question__actions">
        <Button
          type="button"
          label={t("question.no")}
          className="gm-btn gm-btn--ghost"
          disabled={saving}
          onClick={() => onAnswer(false)}
        />
        <Button
          type="button"
          label={t("question.yes")}
          className="gm-btn gm-btn--primary"
          disabled={saving}
          onClick={() => onAnswer(true)}
        />
      </div>
    </Dialog>
  );
}
