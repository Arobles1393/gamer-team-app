import i18n from "../i18n";

// Nombre a mostrar de otro usuario. Si su perfil ya no existe (cuenta
// eliminada) dice "Usuario eliminado"; mientras carga, el respaldo de cada
// pantalla ("Jugador", "Alguien"...).
// missing: true si se sabe que no existe (useUserProfile), o profile === null
// en el mapa de useUserProfiles (undefined = todavía cargando)
export const getDisplayName = (profile, fallback, missing = profile === null) => {
  if (profile?.username) return profile.username;
  return missing ? i18n.t("common:deletedUser") : fallback;
};
