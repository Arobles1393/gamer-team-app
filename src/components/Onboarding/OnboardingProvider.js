import { createContext, useCallback, useContext, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { useOnboarding } from "../../hooks";
import { useCurrentUser, useCurrentUserData, useVerifyPrompt } from "../../context";
import OnboardingDialog from "./OnboardingDialog";
import OnboardingQuestion from "./OnboardingQuestion";

// Solo la acción de abrirla a mano (menú del avatar y Mi perfil): estable,
// para que ningún componente se vuelva a dibujar por el estado de la guía
const OpenOnboardingContext = createContext(() => {});
export const useOpenOnboarding = () => useContext(OpenOnboardingContext);

/**
 * Monta la guía de bienvenida sobre la app (RootRoutes). Los children son
 * elementos ya creados por el padre: los cambios de estado de la guía no
 * vuelven a dibujar la app.
 */
export default function OnboardingProvider({ children }) {
  const { t } = useTranslation("onboarding");
  const user = useCurrentUser();
  const userData = useCurrentUserData();
  // No abrirse sola encima de "Verifica tu correo para continuar"
  const { promptVisible } = useVerifyPrompt();
  const toast = useRef(null);
  const onboarding = useOnboarding(user, userData, { blocked: promptVisible });
  const { phase, manual, steps, saving, openManually, finishSteps, saveAnswer, close } = onboarding;

  const open = useCallback(() => openManually(), [openManually]);

  // Guarda la respuesta; si falla, aviso con "Reintentar" sin bloquear nada
  const persist = useCallback(async (showAgain, { infoOnSuccess = false } = {}) => {
    close();
    const ok = await saveAnswer(showAgain);
    if (ok && infoOnSuccess) {
      toast.current?.show({ severity: "info", summary: t("reopen.title"), detail: t("reopen.detail"), life: 5000 });
    }
    if (!ok) {
      toast.current?.show({
        severity: "error",
        sticky: true,
        content: (props) => (
          <div className="onboarding-toast">
            <strong>{t("saveError.title")}</strong>
            <span>{t("saveError.detail")}</span>
            <Button
              type="button"
              label={t("saveError.retry")}
              className="gm-btn gm-btn--ghost"
              onClick={() => {
                toast.current?.remove(props.message);
                persist(showAgain, { infoOnSuccess });
              }}
            />
          </div>
        )
      });
    }
  }, [close, saveAnswer, t]);

  // Cerrar la pregunta sin responder: en una apertura automática cuenta como
  // "No"; si se abrió a mano, no cambia nada
  const handleDismiss = () => {
    if (manual) {
      close();
      return;
    }
    persist(false, { infoOnSuccess: true });
  };

  return (
    <OpenOnboardingContext.Provider value={open}>
      {children}
      {user && (
        <>
          <OnboardingDialog visible={phase === "steps"} steps={steps} onFinish={finishSteps} />
          <OnboardingQuestion
            visible={phase === "question"}
            saving={saving}
            onAnswer={(showAgain) => persist(showAgain)}
            onDismiss={handleDismiss}
          />
        </>
      )}
      <Toast ref={toast} />
    </OpenOnboardingContext.Provider>
  );
}
