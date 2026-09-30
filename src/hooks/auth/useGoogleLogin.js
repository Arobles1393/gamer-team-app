import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth";
import { getAuthErrorMessage } from "../../utils/authErrors";

export const useGoogleLogin = (onError) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);

    try {
      await authService.loginWithGoogle();
      navigate("/");
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (message) onError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return {
    googleLoading,
    handleGoogleLogin
  };
};
