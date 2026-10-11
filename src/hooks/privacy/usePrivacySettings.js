import { useCallback, useEffect, useState } from "react";
import { preferencesService } from "../../services/preferences";

// Ajustes de privacidad de la cuenta (users/{uid}/private/preferences.privacy).
// allowSteamJoin: "Unirme en Steam"; ausente = false. El cambio se guarda al
// momento; si la escritura falla, vuelve al valor anterior y avisa (onError).
export const usePrivacySettings = (user, onError) => {
  const [allowSteamJoin, setAllow] = useState(false);
  const [loading, setLoading] = useState(Boolean(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) {
      setAllow(false);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    preferencesService.getPreferences(uid)
      .then((data) => {
        if (cancelled) return;
        setAllow(data?.privacy?.allowSteamJoin === true);
        setError(false);
      })
      .catch((err) => {
        console.error("Error leyendo la privacidad:", err.code || err.message);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const setAllowSteamJoin = useCallback(async (value) => {
    if (!uid || saving) return;
    const previous = allowSteamJoin;
    setAllow(value);
    setSaving(true);
    try {
      await preferencesService.updatePreferences(uid, { privacy: { allowSteamJoin: value } });
    } catch (err) {
      console.error("Error guardando la privacidad:", err.code || err.message);
      setAllow(previous);
      onError?.();
    } finally {
      setSaving(false);
    }
  }, [uid, saving, allowSteamJoin, onError]);

  return { allowSteamJoin, loading, saving, error, setAllowSteamJoin };
};
