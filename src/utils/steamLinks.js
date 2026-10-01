// Identificador de Steam (SteamID64 o vanity) a partir de los links del
// perfil: el último tramo de la URL de steamcommunity.com.
// Ej.: .../profiles/76561198000000000 o .../id/minombre/
export const getSteamIdFromLinks = (links) => {
  const steamLink = links?.find(
    (link) => link.includes("steamcommunity")
  );

  if (!steamLink) {
    return null;
  }

  const parts = steamLink.split("/");

  return (
    parts[parts.length - 1] ||
    parts[parts.length - 2] ||
    null
  );
};
