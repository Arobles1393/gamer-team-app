import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { getAuthErrorMessage } from "../../utils/authErrors";
import { authService } from "../../services/auth";
import { useGoogleLogin } from "../../hooks";
import {
  AuthLayout,
  AuthInput,
  PasswordInput,
  GradientButton,
  AuthSwitch,
  AuthDivider,
  GoogleButton
} from "./ui";

export default function Login({ onToggleMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useRef(null);

  const { googleLoading, handleGoogleLogin } = useGoogleLogin((message) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: message,
      life: 3000
    });
  });

  const handleLogin = async () => {
    if (!email || !password || loading) return;
    setLoading(true);

    try {
      await authService.login(
        email,
        password
      );
      navigate("/");
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getAuthErrorMessage(error),
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        title="Bienvenido de vuelta"
        subtitle="Inicia sesión para encontrar tu próximo squad."
        tagline={"Encuentra tu squad.\nCuando quieras jugar."}
        onSubmit={handleLogin}
      >
        <AuthInput
          id="email"
          label="Correo"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordInput
          id="password"
          label="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <GradientButton
          label="Iniciar sesión"
          loading={loading}
          disabled={!email || !password}
        />

        <AuthDivider label="O continúa con" />

        <GoogleButton
          loading={googleLoading}
          disabled={loading}
          onClick={handleGoogleLogin}
        />

        <AuthSwitch
          question="¿No tienes cuenta?"
          action="Crear cuenta"
          onClick={onToggleMode}
        />
      </AuthLayout>

      <Toast ref={toast} />
    </>
  );
}
