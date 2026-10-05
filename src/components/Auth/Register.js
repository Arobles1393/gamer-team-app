import { useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { useTranslation } from "react-i18next";
import { getCountryOptions } from "../../utils/countryNames";
import { getAuthErrorMessage } from "../../utils/authErrors";
import { authService } from "../../services/auth";
import { clearWelcomeNotice, queueWelcomeNotice } from "../../utils/welcomeNotice";
import { useProviderLogin } from "../../hooks";
import {
  AuthLayout,
  AuthInput,
  PasswordInput,
  AuthSelect,
  GradientButton,
  AuthSwitch,
  AuthProviders
} from "./ui";

export default function Register({ onToggleMode, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(false);

  const toast = useRef(null);
  const { t, i18n } = useTranslation("auth");
  // Nombres de países en el idioma actual (se guarda el value, que no cambia)
  const countryOptions = useMemo(() => getCountryOptions(), [i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const { loadingProvider, loginWith } = useProviderLogin((message) => {
    toast.current?.show({
      severity: "error",
      summary: t("common:status.error"),
      detail: message,
      life: 3000
    });
  });

  const handleRegister = async () => {
    if (loading) return;

    if (!email || !password || !username || !region) {
      toast.current?.show({
        severity: "warn",
        summary: t("register.incompleteTitle"),
        detail: t("register.incompleteDetail"),
        life: 3000
      });
      return;
    }

    setLoading(true);

    // La bienvenida la muestra la app: al crearse la cuenta, /login redirige
    // y este formulario ya no está en pantalla
    queueWelcomeNotice();

    try {
      await authService.register({
        email,
        password,
        username,
        region
      });
    } catch (error) {
      clearWelcomeNotice();
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
        compact
        title={t("register.title")}
        subtitle={t("register.subtitle")}
        tagline={t("register.tagline")}
        onSubmit={handleRegister}
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <AuthInput
          id="username"
          label={t("fields.nickname")}
          placeholder={t("fields.nicknamePlaceholder")}
          autoComplete="nickname"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <AuthSelect
          id="region"
          label={t("fields.region")}
          value={region}
          options={countryOptions}
          onChange={(e) => setRegion(e.value)}
          optionLabel="label"
          optionValue="value"
          placeholder={t("fields.regionPlaceholder")}
          filter
        />

        <GradientButton
          label={t("register.submit")}
          loading={loading}
          disabled={!email || !password || !username || !region}
        />

        <AuthProviders
          loadingProvider={loadingProvider}
          disabled={loading}
          onSelect={loginWith}
        />

        <AuthSwitch
          question={t("register.hasAccount")}
          action={t("register.toLogin")}
          onClick={onToggleMode}
        />
      </AuthLayout>

      <Toast ref={toast} />
    </>
  );
}
