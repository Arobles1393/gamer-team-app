import { useEffect, useMemo, useState } from "react";
import { userService } from "../../services/users";

// Perfiles en tiempo real de varios usuarios a la vez (p. ej. la lista de amigos),
// para poder buscar, ordenar y contar sobre ellos. `profiles` los indexa por id;
// un perfil inexistente queda en null.
// publicOnly: para visitantes sin sesión (lee publicProfiles)
export const useUserProfiles = (userIds, { publicOnly = false } = {}) => {
  const [profiles, setProfiles] = useState({});

  // Clave estable: solo se re-suscribe si cambian los ids, no la referencia del array
  const idsKey = userIds.join(",");

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];

    // Descarta los perfiles de usuarios que ya no están en la lista
    setProfiles((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([id]) => ids.includes(id))
      )
    );

    const unsubscribes = ids.map((id) =>
      userService.subscribeToUserProfile(
        id,
        (data) => {
          setProfiles((prev) => ({
            ...prev,
            [id]: data ? { id, ...data } : null
          }));
        },
        (error) => {
          console.error("Error al obtener el perfil del usuario:", error);
          setProfiles((prev) => ({ ...prev, [id]: null }));
        },
        { publicOnly }
      )
    );

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [idsKey, publicOnly]);

  const loading = userIds.some((id) => !(id in profiles));

  const users = useMemo(
    () => userIds.map((id) => profiles[id]).filter(Boolean),
    [userIds, profiles]
  );

  return { users, profiles, loading };
};
