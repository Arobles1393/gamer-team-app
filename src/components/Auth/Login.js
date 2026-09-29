import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { getAuthErrorMessage } from "../../utils/authErrors";
import { authService } from "../../services/auth";
import "./Login.css";

export default function Login({ onToggleMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useRef(null);

  const handleLogin = async (e) => {
    e.preventDefault();
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
    <div className="login">
      <section className="login__media">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="login__video"
        >
          <source src="/video/vidControl.mp4" type="video/mp4" />
        </video>
        <div className="login__media-fade" />

        <div className="login__brand login__brand--media">
          <span className="login__badge">GM</span>
          <span className="login__brand-name">GAMERMATCH</span>
        </div>

        <p className="login__tagline">
          Encuentra tu squad.<br />Cuando quieras jugar.
        </p>
      </section>

      <section className="login__panel">
        <div className="login__brand login__brand--panel">
          <span className="login__badge">GM</span>
          <span className="login__brand-name">GAMERMATCH</span>
        </div>

        <form className="login__form" onSubmit={handleLogin} noValidate>
          <h1 className="login__title">Bienvenido de vuelta</h1>
          <p className="login__subtitle">
            Inicia sesión para encontrar tu próximo squad.
          </p>

          <label className="login__label" htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            className="login__input"
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="login__label" htmlFor="password">Contraseña</label>
          <div className="login__password">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="login__input"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="login__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <i className={`pi ${showPassword ? "pi-eye-slash" : "pi-eye"}`} />
            </button>
          </div>

          <button
            type="submit"
            className="login__submit"
            disabled={!email || !password || loading}
          >
            {loading ? <i className="pi pi-spin pi-spinner" /> : "Iniciar sesión"}
          </button>

          <p className="login__switch">
            ¿No tienes cuenta?{" "}
            <button type="button" onClick={onToggleMode}>Crear cuenta</button>
          </p>
        </form>
      </section>

      <Toast ref={toast} />
    </div>
  );
}
