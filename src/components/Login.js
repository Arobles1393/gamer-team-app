import { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";

export default function Login({ setShowLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          top: 0,
          left: 0,
          zIndex: -1
        }}
      >
        <source src="/video/vidControl.mp4" type="video/mp4" />
      </video>
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.6)",
          zIndex: 0
        }}
      />
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