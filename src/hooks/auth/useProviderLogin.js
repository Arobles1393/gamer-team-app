import { useState } from "react";
import { authService } from "../../services/auth";
import { getAuthErrorMessage } from "../../utils/authErrors";

const PROVIDER_LOGINS = {
  google: authService.loginWithGoogle,
  steam: authService.loginWithSteam
};

// Login con proveedor externo (Google, Steam). `loadingProvider` indica
// cuál está en curso para mostrar el spinner solo en ese botón.
export const useProviderLogin = (onError) => {
  const [loadingProvider, setLoadingProvider] = useState(null);

  const loginWith = async (provider) => {
    if (loadingProvider) return;
    setLoadingProvider(provider);

    try {
      // LoginPage redirige al detectar la sesión
      await PROVIDER_LOGINS[provider]();
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (message) onError(message);
    } finally {
      setLoadingProvider(null);
    }
  };

  return {
    loadingProvider,
    loginWith
  };
};
