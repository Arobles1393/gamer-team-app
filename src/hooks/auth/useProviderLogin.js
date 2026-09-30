import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const loginWith = async (provider) => {
    if (loadingProvider) return;
    setLoadingProvider(provider);

    try {
      await PROVIDER_LOGINS[provider]();
      navigate("/");
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
