import { Button } from "primereact/button";
import SteamIcon from "../../Steam/SteamIcon";

// Estilo del botón oficial "Sign in through Steam" de Valve (fondo #171a21),
// sin el gradiente de marca para que se reconozca como botón de Steam.
export default function SteamButton({ label = "Continuar con Steam", ...buttonProps }) {
  return (
    <Button
      type="button"
      className="auth__steam"
      label={label}
      icon={<SteamIcon className="auth__steam-logo" />}
      {...buttonProps}
    />
  );
}
