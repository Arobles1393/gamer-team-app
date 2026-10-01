import { useEffect, useState } from "react";

// Admin = custom claim `admin` en el token de Firebase Auth (lo asigna
// functions/scripts/setAdmin.js). Las reglas validan el mismo claim, así
// que esto solo decide qué se muestra.
export const useIsAdmin = (user) => {
  const [state, setState] = useState({ isAdmin: false, loading: Boolean(user) });

  useEffect(() => {
    if (!user) {
      setState({ isAdmin: false, loading: false });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    // true: refresca el token por si el claim se asignó después del login
    user.getIdTokenResult(true)
      .then((result) => {
        if (!cancelled) setState({ isAdmin: result.claims.admin === true, loading: false });
      })
      .catch((error) => {
        console.error("Error leyendo permisos de admin:", error);
        if (!cancelled) setState({ isAdmin: false, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return state;
};
