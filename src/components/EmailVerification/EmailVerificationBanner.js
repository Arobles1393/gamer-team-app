import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { useCurrentUser, useEmailVerification } from "../../context";
import { useVerifyPrompt } from "../../context/VerifyPromptContext";
import "./EmailVerification.css";

// Cada cuánto se revisa sola mientras el aviso esté visible
const AUTO_CHECK_MS = 10 * 1000;

// Aviso persistente para cuentas con contraseña sin verificar. Se revisa
// solo (cada 10 s y al volver a la pestaña) para que, al abrir el enlace
// del correo, todo se habilite sin recargar.
export default function EmailVerificationBanner() {
  const { t } = useTranslation("auth");
  const user = useCurrentUser();
  const { needsEmailVerification } = useEmailVerification();
  const { resend, sending, cooldown, check, checking } = useVerifyPrompt();

  useEffect(() => {
    if (!needsEmailVerification) return undefined;

    const autoCheck = () => check({ silent: true });
    const interval = setInterval(autoCheck, AUTO_CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") autoCheck();
    };
    window.addEventListener("focus", autoCheck);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", autoCheck);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [needsEmailVerification, check]);

  if (!needsEmailVerification) return null;

  return (
    <section className="verify-banner" aria-label={t("verify.bannerLabel")}>
      <span className="verify-banner__icon" aria-hidden="true">
        <i className="pi pi-envelope" />
      </span>
      <p className="verify-banner__text">
        <strong>{t("verify.bannerTitle")}</strong>{" "}
        {t("verify.bannerText", { email: user?.email })}
      </p>
      <div className="verify-banner__actions">
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
    </section>
  );
}
