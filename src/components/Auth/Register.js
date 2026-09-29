import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { countries } from "../../data/countries";
import { getAuthErrorMessage } from "../../utils/authErrors";
import { authService } from "../../services/auth";
import { profileService } from "../../services/profile";
import {
  AuthLayout,
  AuthInput,
  PasswordInput,
  AuthSelect,
  GradientButton,
  AuthSwitch
} from "./ui";

export default function Register({ onToggleMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(false);

  const toast = useRef(null);

  const handleRegister = async () => {
    if (loading) return;

    if (!email || !password || !username || !region) {
      toast.current?.show({
        severity: "warn",
        summary: "Campos incompletos",
        detail: "Completa todos los campos obligatorios",
        life: 3000
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential =
        await authService.register(
          email,
          password
        );

      await profileService.createUserProfile(
        userCredential.user.uid,
        {
          email,
          username,
          phone,
          region
        }
      );

      toast.current?.show({
        severity: "success",
        summary: "Cuenta creada",
        detail: "Bienvenido a GamerMatch 🎮",
        life: 3000
      });

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
        compact
        title="Crea tu cuenta"
        subtitle="Únete a la comunidad y encuentra jugadores como tú."
        tagline={"Tu próxima partida\nempieza aquí."}
        onSubmit={handleRegister}
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <AuthInput
          id="username"
          label="Nickname"
          placeholder="Cómo te van a reconocer"
          autoComplete="nickname"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <AuthInput
          id="phone"
          label="Teléfono"
          hint="(opcional)"
          type="tel"
          placeholder="55 1234 5678"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <AuthSelect
          id="region"
          label="Región"
          value={region}
          options={countries}
          onChange={(e) => setRegion(e.value)}
          optionLabel="label"
          placeholder="Selecciona tu región"
          filter
        />

        <GradientButton
          label="Crear cuenta"
          loading={loading}
          disabled={!email || !password || !username || !region}
        />

        <AuthSwitch
          question="¿Ya tienes cuenta?"
          action="Iniciar sesión"
          onClick={onToggleMode}
        />
      </AuthLayout>

      <Toast ref={toast} />
    </>
  );
}
