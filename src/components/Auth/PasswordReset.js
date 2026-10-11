import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { usePasswordReset } from "../../hooks";
import { AuthLayout, AuthInput, GradientButton, AuthSwitch } from "./ui";

// Ruta pública /recuperar: manda el enlace para restablecer la contraseña.
// El aviso es el mismo exista o no la cuenta (no revela quién está registrado).
export default function PasswordReset() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useRef(null);
  // Si viene del login, el correo que ya había escrito
  const [email, setEmail] = useState(location.state?.email ?? "");

  const { send, sending, sent, cooldown } = usePasswordReset((message) => {
    toast.current?.show({ severity: "error", summary: t("common:status.error"), detail: message, life: 4000 });
  });

  const goToLogin = () => navigate("/login", { replace: true });

  const label = cooldown > 0
    ? t("reset.resendIn", { count: cooldown })
    : t(sent ? "reset.resend" : "reset.submit");

  return (
    <>
      <AuthLayout
        title={t("reset.title")}
        subtitle={t("reset.subtitle")}
        tagline={t("login.tagline")}
        onSubmit={() => send(email)}
        onBack={goToLogin}
        backLabel={t("reset.backToLogin")}
      >
        <AuthInput
          id="email"
          label={t("fields.email")}
          type="email"
          placeholder={t("fields.emailPlaceholder")}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {sent && (
          <p className="auth__notice" role="status">
            <i className="pi pi-envelope" aria-hidden="true" />
            {t("reset.sent")}
          </p>
        )}

        <GradientButton
          label={label}
          loading={sending}
          disabled={!email.trim() || cooldown > 0}
        />

        <p className="auth__help">
          <i className="pi pi-info-circle" aria-hidden="true" />
          {t("reset.providersHelp")}
        </p>

        <AuthSwitch
          question={t("reset.remembered")}
          action={t("reset.toLogin")}
          onClick={goToLogin}
        />
      </AuthLayout>

      <Toast ref={toast} />
    </>
  );
}
