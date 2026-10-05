import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { preferencesService } from "../../services/preferences";
import { getAvailableSteps, ONBOARDING_VERSION } from "../../onboarding/onboardingSteps";
import { isOnboardingBlockedPath } from "../../routes/appPaths";

// Marca de "ya se mostró en esta sesión" (showAgain: true)
const shownKey = (uid) => `gm-onboarding-shown-${uid}`;
const wasShown = (uid) => {
  try {
    return sessionStorage.getItem(shownKey(uid)) === "1";
  } catch {
    return false;
  }
};
const markShown = (uid) => {
  try {
    sessionStorage.setItem(shownKey(uid), "1");
  } catch {
    // Sin almacenamiento: puede volver a salir al recargar, no es grave
  }
};

// Se olvida al cerrar sesión: con showAgain vuelve a salir al iniciar la siguiente
export const clearOnboardingSession = () => {
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith("gm-onboarding-shown-"))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Nada que limpiar
  }
};

// ¿Debe abrirse sola? Sin documento o sin completar: sí. Completada y con
// showAgain: una vez por sesión de login. Completada sin showAgain: nunca.
const shouldAutoOpen = (preferences, uid) => {
  const onboarding = preferences?.onboarding;
  if (!onboarding?.completed) return true;
  return onboarding.showAgain === true && !wasShown(uid);
};

/**
 * Guía de bienvenida. Lee users/{uid}/private/preferences UNA vez al tener
 * sesión y perfil (sin listener) y decide si abrirse sola. No se abre en
 * /login, /recuperar, el retorno de Steam, /admin/* ni las páginas legales,
 * ni mientras haya otro diálogo modal (blocked).
 * phase: "closed" | "steps" | "question" (¿volver a mostrarla?)
 * manual: abierta desde el menú o el perfil (cerrar la pregunta sin
 * responder no cambia nada)
 */
export const useOnboarding = (user, userData, { blocked = false } = {}) => {
  const { pathname } = useLocation();
  const steps = useMemo(() => getAvailableSteps(), []);
  const [phase, setPhase] = useState("closed");
  const [manual, setManual] = useState(false);
  const [preferences, setPreferences] = useState(undefined); // undefined = sin leer
  const [saving, setSaving] = useState(false);
  const uid = user?.uid ?? null;
  const hasProfile = Boolean(userData);
  const decidedRef = useRef(null);

  // Una lectura por sesión de usuario; si falla, la guía no se muestra
  useEffect(() => {
    setPreferences(undefined);
    decidedRef.current = null;
    setPhase("closed");
    if (!uid || !hasProfile) return undefined;

    let cancelled = false;
    preferencesService.getPreferences(uid)
      .then((data) => {
        if (!cancelled) setPreferences(data);
      })
      .catch((error) => {
        console.error("Error leyendo preferencias (la guía no se muestra):", error.code || error.message);
        if (!cancelled) setPreferences(null);
        decidedRef.current = uid;
      });
    return () => {
      cancelled = true;
    };
  }, [uid, hasProfile]);

  // Abrirse sola, una sola decisión por usuario (y esperando a una ruta
  // permitida y a que no haya otro diálogo abierto)
  useEffect(() => {
    if (!uid || preferences === undefined || decidedRef.current === uid) return;
    if (blocked || isOnboardingBlockedPath(pathname)) return;
    decidedRef.current = uid;
    if (shouldAutoOpen(preferences, uid)) {
      markShown(uid);
      setManual(false);
      setPhase("steps");
    }
  }, [uid, preferences, pathname, blocked]);

  const openManually = useCallback(() => {
    setManual(true);
    setPhase("steps");
  }, []);

  // Terminar o saltar: antes de cerrar, la pregunta final
  const finishSteps = useCallback(() => setPhase("question"), []);

  // showAgain: respuesta (o false al cerrar sin responder en una apertura
  // automática). Devuelve true si se guardó.
  const saveAnswer = useCallback(async (showAgain) => {
    if (!uid) return false;
    setSaving(true);
    const onboarding = { completed: true, showAgain, completedVersion: ONBOARDING_VERSION };
    try {
      await preferencesService.updatePreferences(uid, { onboarding });
      // "Sí, mostrármela de nuevo": la de esta sesión ya cuenta como vista,
      // vuelve a salir en el próximo inicio de sesión (no al recargar)
      if (showAgain) markShown(uid);
      setPreferences((prev) => ({ ...(prev ?? {}), onboarding }));
      return true;
    } catch (error) {
      console.error("Error guardando la respuesta de la guía:", error.code || error.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [uid]);

  const close = useCallback(() => setPhase("closed"), []);

  return {
    phase,
    open: phase !== "closed",
    manual,
    steps,
    saving,
    start: openManually,
    openManually,
    finishSteps,
    saveAnswer,
    close
  };
};
