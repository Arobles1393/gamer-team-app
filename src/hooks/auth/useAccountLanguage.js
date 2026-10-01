import { useEffect } from "react";
import { getAppLanguage, isAppLanguage, setAppLanguage } from "../../i18n";

// Al iniciar sesión, el idioma guardado en la cuenta (users/{uid}.language)
// gana sobre el detectado en este dispositivo: el idioma viaja con el
// usuario. Si la cuenta no tiene idioma, se queda el del navegador.
export const useAccountLanguage = (userData) => {
  const accountLanguage = userData?.language;

  useEffect(() => {
    if (isAppLanguage(accountLanguage) && accountLanguage !== getAppLanguage()) {
      setAppLanguage(accountLanguage);
    }
  }, [accountLanguage]);
};
