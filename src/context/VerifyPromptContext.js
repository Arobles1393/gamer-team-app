import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { authService } from "../services/auth";
import { useCooldown } from "../hooks/auth/useCooldown";
import { getAuthErrorMessage } from "../utils/authErrors";
import i18n from "../i18n";
import { useCurrentUser, useEmailVerification } from "./AuthContext";

// Acciones del correo de verificación compartidas por el aviso persistente
// y el diálogo "Verifica tu correo para continuar" (misma cuenta regresiva
// de reenvío). Fuera del proveedor (p. ej. /login) no hace nada.
const VerifyPromptContext = createContext({
  closePrompt: () => {},
  promptVisible: false,
  resend: async () => {},
  sending: false,
  cooldown: 0,
  check: async () => false,
  checking: false
});

// Aparte y estable: lo usan todas las acciones sociales (useRequireVerified)
// y no deben re-renderizarse con cada segundo de la cuenta regresiva
const OpenVerifyPromptContext = createContext(() => {});

// Envuelve la app (RootRoutes). `dialog`: el diálogo a dibujar (se pasa
// desde fuera para no importar componentes desde context/)
export const VerifyPromptProvider = ({ dialog = null, children }) => {
  const toast = useRef(null);
  const notify = useCallback((message) => {
    toast.current?.show({ life: 4000, ...message });
  }, []);
  const user = useCurrentUser();
  const { refresh } = useEmailVerification();
  const [promptVisible, setPromptVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const { remaining, active, start } = useCooldown(60);

  const resend = useCallback(async () => {
    if (!user || sending || active) return;
    setSending(true);
    try {
      await authService.sendVerificationEmail(user);
      start();
      notify({ severity: "info", summary: i18n.t("auth:verify.sentTitle"), detail: i18n.t("auth:verify.sentDetail", { email: user.email }) });
    } catch (error) {
      // too-many-requests también arranca la espera
      if (error.code === "auth/too-many-requests") start();
      notify({ severity: "error", summary: i18n.t("common:status.error"), detail: getAuthErrorMessage(error) });
    } finally {
      setSending(false);
    }
  }, [user, sending, active, start, notify]);

  // silent: la revisión automática no avisa si todavía no está verificado
  const check = useCallback(async ({ silent = false } = {}) => {
    if (!user) return false;
    if (!silent) setChecking(true);
    try {
      const verified = await refresh({ forceToken: !silent });
      if (verified) {
        setPromptVisible(false);
        notify({ severity: "success", summary: i18n.t("auth:verify.doneTitle"), detail: i18n.t("auth:verify.doneDetail") });
      } else if (!silent) {
        notify({ severity: "warn", summary: i18n.t("auth:verify.notYetTitle"), detail: i18n.t("auth:verify.notYetDetail") });
      }
      return verified;
    } catch (error) {
      if (!silent) notify({ severity: "error", summary: i18n.t("common:status.error"), detail: getAuthErrorMessage(error) });
      return false;
    } finally {
      if (!silent) setChecking(false);
    }
  }, [user, refresh, notify]);

  const openPrompt = useCallback(() => setPromptVisible(true), []);

  const value = useMemo(() => ({
    closePrompt: () => setPromptVisible(false),
    promptVisible,
    resend,
    sending,
    cooldown: remaining,
    check,
    checking
  }), [promptVisible, resend, sending, remaining, check, checking]);

  return (
    <OpenVerifyPromptContext.Provider value={openPrompt}>
      <VerifyPromptContext.Provider value={value}>
        {children}
        {dialog}
        <Toast ref={toast} />
      </VerifyPromptContext.Provider>
    </OpenVerifyPromptContext.Provider>
  );
};

// Estado del reenvío y la revisión (aviso persistente y diálogo)
export const useVerifyPrompt = () => useContext(VerifyPromptContext);

// Solo abrir el diálogo
export const useOpenVerifyPrompt = () => useContext(OpenVerifyPromptContext);
