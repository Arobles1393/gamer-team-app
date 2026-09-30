import AuthDivider from "./AuthDivider";
import GoogleButton from "./GoogleButton";
import SteamButton from "./SteamButton";

// Divisor + botones de proveedores externos, compartido por Login y Register
export default function AuthProviders({ loadingProvider, disabled, onSelect }) {
  const busy = disabled || Boolean(loadingProvider);

  return (
    <>
      <AuthDivider label="O continúa con" />

      <div className="auth__providers">
        <GoogleButton
          loading={loadingProvider === "google"}
          disabled={busy}
          onClick={() => onSelect("google")}
        />

        <SteamButton
          loading={loadingProvider === "steam"}
          disabled={busy}
          onClick={() => onSelect("steam")}
        />
      </div>
    </>
  );
}
