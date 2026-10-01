import { useTranslation } from "react-i18next";
import AuthDivider from "./AuthDivider";
import GoogleButton from "./GoogleButton";
import SteamButton from "./SteamButton";

// Divisor + botones de proveedores externos, compartido por Login y Register
export default function AuthProviders({ loadingProvider, disabled, onSelect }) {
  const { t } = useTranslation("auth");
  const busy = disabled || Boolean(loadingProvider);

  return (
    <>
      <AuthDivider label={t("providers.divider")} />

      <div className="auth__providers">
        <GoogleButton
          label={t("providers.google")}
          loading={loadingProvider === "google"}
          disabled={busy}
          onClick={() => onSelect("google")}
        />

        <SteamButton
          label={t("providers.steam")}
          loading={loadingProvider === "steam"}
          disabled={busy}
          onClick={() => onSelect("steam")}
        />
      </div>
    </>
  );
}
