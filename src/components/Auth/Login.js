import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { useTranslation } from "react-i18next";
import { getAuthErrorMessage } from "../../utils/authErrors";
import { authService } from "../../services/auth";
import { useProviderLogin } from "../../hooks";
import {
  AuthLayout,
  AuthInput,
  PasswordInput,
  GradientButton,
  AuthSwitch,
  AuthProviders
} from "./ui";

export default function Login({ onToggleMode, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const { t } = useTranslation("auth");

  const { loadingProvider, loginWith } = useProviderLogin((message) => {
    toast.current?.show({
      severity: "error",
      summary: t("common:status.error"),
      detail: message,
      life: 3000
    });
  });

  const handleLogin = async () => {
    if (!email || !password || loading) return;
    setLoading(true);

    try {
      // LoginPage redirige al detectar la sesión
      await authService.login(
        email,
        password
      );
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: t("common:status.error"),
        detail: getAuthErrorMessage(error),
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        title={t("login.title")}
        subtitle={t("login.subtitle")}
        tagline={t("login.tagline")}
        onSubmit={handleLogin}
        onBack={onBack}
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

        <PasswordInput
          id="password"
          label={t("fields.password")}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <GradientButton
          label={t("login.submit")}
          loading={loading}
          disabled={!email || !password}
        />

        <AuthProviders
          loadingProvider={loadingProvider}
          disabled={loading}
          onSelect={loginWith}
        />

        <AuthSwitch
          question={t("login.noAccount")}
          action={t("login.toRegister")}
          onClick={onToggleMode}
        />
      </AuthLayout>

      <Toast ref={toast} />
    </>
  );
}
