import { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";

export default function Login({ setShowLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}
    >
      <Card 
        title="GamerMatch" 
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 1.0s ease",
          background: "rgba(255,255,255,0.1)",
          color: "#fff",
        }}
      >
        <div 
          className="p-fluid"
        >
          <span 
            className="p-float-label" 
            style={{
              marginBottom: "1.5rem"
            }}
          >
            <InputText
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="email">Correo</label>
          </span>
          <span 
            className="p-float-label" 
            style={{ 
              marginBottom: "1.5rem" 
            }}
          >
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              feedback={false}
              toggleMask
            />
            <label htmlFor="password">Contraseña</label>
          </span>
          <Button
            label="Iniciar sesión"
            icon="pi pi-sign-in"
            onClick={handleLogin}
            disabled={!email || !password}
            className="p-button-success"
            style={{ width: "100%", marginBottom: "1rem" }}
          />
          <Button
            label="Crear cuenta"
            icon="pi pi-user-plus"
            onClick={() => setShowLogin(false)}
            className="p-button-text"
          />
        </div>
      </Card>
    </div>
  );
}