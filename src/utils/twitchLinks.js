// Usuarios de Twitch: 4-25 caracteres, letras, números y guion bajo
const TWITCH_USERNAME = /^[a-z0-9_]{4,25}$/;

// Usuario de Twitch a partir de los links del perfil (twitch.tv/{usuario}),
// en minúsculas. Mismo patrón que getSteamIdFromLinks. null si no hay link
// o el tramo no tiene formato de usuario.
export const getTwitchUsernameFromLinks = (links) => {
  const twitchLink = links?.find((link) => link.toLowerCase().includes("twitch.tv"));

  if (!twitchLink) {
    return null;
  }

  const match = twitchLink.toLowerCase().match(/twitch\.tv\/([^/?#\s]+)/);
  const username = match?.[1];

  return username && TWITCH_USERNAME.test(username) ? username : null;
};
