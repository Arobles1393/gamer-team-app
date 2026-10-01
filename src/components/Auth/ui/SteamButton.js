import { Button } from "primereact/button";
import { useTranslation } from "react-i18next";
import SteamIcon from "../../Steam/SteamIcon";

// Estilo del botón oficial "Sign in through Steam" de Valve (fondo #171a21),
// sin el gradiente de marca para que se reconozca como botón de Steam.
export default function SteamButton({ label, ...buttonProps }) {
  const { t } = useTranslation("auth");

  return (
    <Button
      type="button"
      className="auth__steam"
      label={label ?? t("providers.steam")}
      icon={<SteamIcon className="auth__steam-logo" />}
      {...buttonProps}
    />
  );
}
