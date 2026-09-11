import { useRef, useState, useEffect } from "react";
import { auth } from "../../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { getAuthErrorMessage } from "../../utils/authErrors";

export default function Login({ onToggleMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useRef(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleLogin = async () => {
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      toast.current.show({
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
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Card
        title="GamerMatch"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 1.0s ease",
          background: "rgba(255,255,255,0.1)",
          color: "#fff"
        }}
      >
        <div className="p-fluid">
          <span className="p-float-label" style={{ marginBottom: "1.5rem" }}>
            <InputText
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="email">Correo</label>
          </span>

          <span className="p-float-label" style={{ marginBottom: "1.5rem" }}>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              feedback={false}
              toggleMask
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
            />
            <label htmlFor="password">Contraseña</label>
          </span>

          <Button
            label="Iniciar sesión"
            icon="pi pi-sign-in"
            onClick={handleLogin}
            disabled={!email || !password}
            loading={loading}
            className="p-button-success"
            style={{ width: "100%", marginBottom: "1rem" }}
          />

          <Button
            label="Crear cuenta"
            icon="pi pi-user-plus"
            onClick={onToggleMode}
            className="p-button-text"
          />
        </div>
      </Card>

      <Toast ref={toast} />
    </div>
  );
}