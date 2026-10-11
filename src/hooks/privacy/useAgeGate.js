import { useCallback, useEffect, useState } from "react";
import { preferencesService } from "../../services/preferences";
import { profileService } from "../../services/profile";
import { hasConfirmedAge } from "../../legal/ageConfirmation";

/**
 * Primeros pasos de una cuenta, con UNA lectura de
 * users/{uid}/private/preferences al tener sesión y perfil (sin listener):
 * 1. "Tengo 18 años o más" para cuentas que todavía no lo confirmaron: las
 *    de Google y Steam (no pasan por el formulario de registro) y las
 *    creadas antes de que existiera la casilla.
 * 2. "Elige tu apodo" (chooseUsername) para las que empiezan con un apodo
 *    genérico: Google (su nombre suele ser el real) y perfiles rehechos.
 * status: "idle" (sin sesión o leyendo) | "pending" (falta la edad) |
 * "confirmed"
 * Si la lectura falla no bloquea la app (se vuelve a leer en el próximo
 * inicio de sesión o al recargar).
 */
export const useAgeGate = (user, userData) => {
  const [status, setStatus] = useState("idle");
  const [chooseUsername, setChooseUsername] = useState(false);
  const [saving, setSaving] = useState(false);
  const uid = user?.uid ?? null;
  const hasProfile = Boolean(userData);

  useEffect(() => {
    setStatus("idle");
    setChooseUsername(false);
    if (!uid || !hasProfile) return undefined;

    let cancelled = false;
    preferencesService.getPreferences(uid)
      .then((data) => {
        if (cancelled) return;
        setStatus(hasConfirmedAge(data) ? "confirmed" : "pending");
        setChooseUsername(data?.chooseUsername === true);
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

  // "Elige tu apodo": username = el nuevo, o null para quedarse con el
  // genérico ("Ahora no"). Devuelve null si salió bien o el código de error
  // ("auth/username-taken", "profile/username-required" u otro)
  const finishUsername = useCallback(async (username) => {
    if (!uid) return "unknown";
    setSaving(true);
    try {
      if (username !== null) await profileService.renameUser(uid, username);
      await preferencesService.setChooseUsername(uid, false);
      setChooseUsername(false);
      return null;
    } catch (error) {
      console.error("Error guardando el apodo:", error.code || error.message);
      return error.code || "unknown";
    } finally {
      setSaving(false);
    }
  }, [uid]);

  return { status, pending: status === "pending", chooseUsername, saving, confirm, finishUsername };
};
