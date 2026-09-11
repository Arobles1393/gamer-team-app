import { useRef, useState, useEffect } from "react";
import { auth, db } from "../../firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { FloatLabel } from "primereact/floatlabel";
import { Dropdown } from "primereact/dropdown";
import { countries } from "../../data/countries";
import { getAuthErrorMessage } from "../../utils/authErrors";

export default function Register({ onToggleMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [visible, setVisible] = useState(false);
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(false);

  const toast = useRef(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleRegister = async () => {
    if (!email || !password || !username || !region) {
      toast.current.show({
        severity: "warn",
        summary: "Campos incompletos",
        detail: "Completa todos los campos obligatorios",
        life: 3000
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        username,
        phone,
        region,
        createdAt: new Date()
      });

      toast.current.show({
        severity: "success",
        summary: "Cuenta creada",
        detail: "Bienvenido a GamerMatch 🎮",
        life: 3000
      });

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
        title="Crear cuenta"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 1.0s ease",
          background: "rgba(255,255,255,0.1)",
          color: "#fff"
        }}
      >
        <div className="p-fluid">
          <FloatLabel style={{ marginBottom: "1.5rem" }}>
            <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="email">Correo</label>
          </FloatLabel>

          <FloatLabel style={{ marginBottom: "1.5rem" }}>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              feedback={false}
              toggleMask
            />
            <label htmlFor="password">Contraseña</label>
          </FloatLabel>

          <FloatLabel style={{ marginBottom: "1.5rem" }}>
            <InputText id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <label htmlFor="username">Nickname</label>
          </FloatLabel>

          <FloatLabel style={{ marginBottom: "1.5rem" }}>
            <InputText id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <label htmlFor="phone">Teléfono (opcional)</label>
          </FloatLabel>

          <FloatLabel style={{ marginBottom: "1.5rem" }}>
            <Dropdown
              id="region"
              value={region}
              options={countries}
              onChange={(e) => setRegion(e.value)}
              optionLabel="label"
              placeholder="Selecciona tu región"
              filter
            />
            <label htmlFor="region">Región</label>
          </FloatLabel>

          <Button
            label="Registrarse"
            icon="pi pi-user-plus"
            onClick={handleRegister}
            disabled={!email || !password || !username || !region}
            loading={loading}
            className="p-button-success"
            style={{ width: "100%", marginBottom: "1rem" }}
          />

          <Button
            label="Ya tengo cuenta"
            icon="pi pi-sign-in"
            onClick={onToggleMode}
            className="p-button-text"
          />
        </div>
      </Card>

      <Toast ref={toast} />
    </div>
  );
}