import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import "./Onboarding.css";

// Pasos de la guía: icono, título, texto, progreso (puntos) y Atrás /
// Siguiente / Saltar. Flechas del teclado para moverse; Escape = saltar.
// El foco queda dentro del diálogo (lo hace Dialog).
export default function OnboardingDialog({ visible, steps, onFinish }) {
  const { t } = useTranslation("onboarding");
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  // En celular, abajo y casi a pantalla completa (deja ver el aviso de
  // verificar el correo arriba)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia?.("(max-width: 767px)").matches ?? false);
  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 767px)");
    if (!query) return undefined;
    const update = () => setIsMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Cada apertura empieza desde el primer paso
  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  const next = () => (isLast ? onFinish() : setIndex((i) => i + 1));
  const back = () => setIndex((i) => Math.max(0, i - 1));

  // Flechas en todo el diálogo (también con el foco en los botones).
  // En el último paso, → no cierra: hay que pulsar Terminar
  const total = steps.length;
  useEffect(() => {
    if (!visible) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((i) => Math.min(total - 1, i + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, total]);

  if (!step) return null;

  return (
    <Dialog
      visible={visible}
      onHide={onFinish}
      header={t("header")}
      className="gm-dialog onboarding"
      maskClassName="gm-dialog-mask onboarding-mask"
      position={isMobile ? "bottom" : "center"}
      modal
      draggable={false}
      resizable={false}
      dismissableMask={false}
      aria-label={t("header")}
    >
      <div className="onboarding__body" role="group" aria-roledescription={t("roleDescription")}>
        <span className="onboarding__icon" aria-hidden="true">
          <i className={`pi ${step.icon}`} />
        </span>
        <h2 className="onboarding__title" aria-live="polite">{t(step.titleKey)}</h2>
        <p className="onboarding__text">{t(step.bodyKey)}</p>

        <p className="onboarding__progress-text">{t("progress", { current: index + 1, total: steps.length })}</p>
        <ol className="onboarding__dots" aria-hidden="true">
          {steps.map((s, i) => (
            <li key={s.id} className={`onboarding__dot${i === index ? " onboarding__dot--active" : ""}${i < index ? " onboarding__dot--done" : ""}`} />
          ))}
        </ol>
      </div>

      <div className="onboarding__actions">
        <Button
          type="button"
          label={t("skip")}
          className="gm-btn gm-btn--ghost onboarding__skip"
          onClick={onFinish}
        />
        <div className="onboarding__nav">
          <Button
            type="button"
            label={t("back")}
            icon="pi pi-arrow-left"
            className="gm-btn gm-btn--ghost"
            disabled={isFirst}
            onClick={back}
          />
          <Button
            type="button"
            label={isLast ? t("finish") : t("next")}
            icon={isLast ? "pi pi-check" : "pi pi-arrow-right"}
            iconPos="right"
            className="gm-btn gm-btn--primary"
            onClick={next}
            autoFocus
          />
        </div>
      </div>
      <p className="onboarding__hint">{t("keyboardHint")}</p>
    </Dialog>
  );
}
