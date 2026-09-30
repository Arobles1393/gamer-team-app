// Popup de Steam OpenID 2.0: abre el login de Steam y espera a que la
// página /auth/steam/return devuelva los parámetros openid.*.

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select";

export const STEAM_AUTH_MESSAGE = "steam-auth";
export const STEAM_RETURN_PATH = "/auth/steam/return";

const POPUP_WIDTH = 800;
const POPUP_HEIGHT = 720;

// Tiempo extra tras cerrarse el popup por si el mensaje aún viene en camino
const CLOSE_GRACE_MS = 800;

const authError = (code) => Object.assign(new Error(code), { code });

const buildSteamLoginUrl = () => {
  const origin = window.location.origin;

  const params = new URLSearchParams({
    "openid.mode": "checkid_setup",
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.return_to": `${origin}${STEAM_RETURN_PATH}`,
    "openid.realm": origin,
    "openid.identity": IDENTIFIER_SELECT,
    "openid.claimed_id": IDENTIFIER_SELECT
  });

  return `${STEAM_OPENID_URL}?${params}`;
};

const openCenteredPopup = (url) => {
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;

  return window.open(
    url,
    "steam-login",
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`
  );
};

// Debe llamarse directo desde el click: si hay un await antes de
// window.open, el navegador bloquea el popup.
export const requestSteamOpenIdParams = () => {
  const popup = openCenteredPopup(buildSteamLoginUrl());

  if (!popup) {
    return Promise.reject(authError("auth/popup-blocked"));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let closeTimer = null;

    // Respaldo si el navegador corta window.opener durante el login
    const channel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel(STEAM_AUTH_MESSAGE)
      : null;

    const cleanup = () => {
      settled = true;
      window.removeEventListener("message", handleMessage);
      channel?.close();
      clearInterval(closedPoll);
      clearTimeout(closeTimer);
    };

    const accept = (data) => {
      if (settled || data?.type !== STEAM_AUTH_MESSAGE || !data.params) return;
      cleanup();
      resolve(data.params);
    };

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      accept(event.data);
    };

    window.addEventListener("message", handleMessage);
    if (channel) channel.onmessage = (event) => accept(event.data);

    // Cerrado sin mensaje = el usuario canceló
    const closedPoll = setInterval(() => {
      if (!popup.closed || closeTimer) return;

      closeTimer = setTimeout(() => {
        if (settled) return;
        cleanup();
        reject(authError("auth/popup-closed-by-user"));
      }, CLOSE_GRACE_MS);
    }, 500);
  });
};
