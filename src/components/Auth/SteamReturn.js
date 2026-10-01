import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { STEAM_AUTH_MESSAGE } from "../../services/auth/steamPopup";
import "./Auth.css";

const readOpenIdParams = () => {
  const entries = [...new URLSearchParams(window.location.search)]
    .filter(([key]) => key.startsWith("openid."));

  return entries.length ? Object.fromEntries(entries) : null;
};

// Destino del popup de Steam: devuelve los parámetros openid.* a la ventana
// principal y se cierra. La verificación real ocurre en la Cloud Function.
export default function SteamReturn() {
  const [failed, setFailed] = useState(false);
  const { t } = useTranslation("auth");

  useEffect(() => {
    const params = readOpenIdParams();

    if (!params) {
      setFailed(true);
      return;
    }

    const message = { type: STEAM_AUTH_MESSAGE, params };

    if (window.opener) {
      window.opener.postMessage(message, window.location.origin);
    } else if (typeof BroadcastChannel !== "undefined") {
      // El navegador cortó window.opener: misma pestaña de origen por otro canal
      const channel = new BroadcastChannel(STEAM_AUTH_MESSAGE);
      channel.postMessage(message);
      channel.close();
    } else {
      setFailed(true);
      return;
    }

    window.close();

    // Si el navegador no permitió cerrarla, al menos no queda en blanco
    const fallback = setTimeout(() => setFailed(true), 1000);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <div className="auth-return" role="status">
      {failed ? t("steamReturn.canClose") : t("steamReturn.connecting")}
    </div>
  );
}
