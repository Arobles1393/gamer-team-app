import { useCallback, useEffect, useState } from "react";
import { preferencesService } from "../../services/preferences";
import { hasConfirmedAge } from "../../legal/ageConfirmation";

/**
 * "Tengo 18 años o más" para cuentas que todavía no lo confirmaron: las de
 * Google y Steam (no pasan por el formulario de registro) y las creadas
 * antes de que existiera la casilla. Lee users/{uid}/private/preferences UNA
 * vez al tener sesión y perfil (sin listener).
 * status: "idle" (sin sesión o leyendo) | "pending" (hay que preguntar) |
 * "confirmed"
 * Si la lectura falla no bloquea la app (se vuelve a leer en el próximo
 * inicio de sesión o al recargar).
 */
export const useAgeGate = (user, userData) => {
  const [status, setStatus] = useState("idle");
  const [saving, setSaving] = useState(false);
  const uid = user?.uid ?? null;
  const hasProfile = Boolean(userData);

  useEffect(() => {
    setStatus("idle");
    if (!uid || !hasProfile) return undefined;

    let cancelled = false;
    preferencesService.getPreferences(uid)
      .then((data) => {
        if (!cancelled) setStatus(hasConfirmedAge(data) ? "confirmed" : "pending");
      })
      .catch((error) => {
        console.error("Error leyendo la confirmación de edad:", error.code || error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, hasProfile]);

  // true si se guardó
  const confirm = useCallback(async () => {
    if (!uid) return false;
    setSaving(true);
    try {
      await preferencesService.saveAgeConfirmation(uid);
      setStatus("confirmed");
      return true;
    } catch (error) {
      console.error("Error guardando la confirmación de edad:", error.code || error.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [uid]);

  return { status, pending: status === "pending", saving, confirm };
};
