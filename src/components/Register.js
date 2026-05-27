import { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import { Dropdown } from "primereact/dropdown";

export default function Register({ setShowLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [visible, setVisible] = useState(false);
  const [countries, setCountries] = useState([]);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,flags"
        );
        const data = await res.json();
        const countries = data
          .map((country) => ({
            label: country.name.common,
            value: country.name.common,
            flag: country.flags.png
          }))
          .sort((a, b) =>
            a.label.localeCompare(b.label)
          );
        setCountries(countries);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCountries();
  }, []);

  const handleRegister = async () => {
    if (!email || !password || !username || !region) {
      alert("Completa todos los campos");
      return;
    }

    try {
      // Crear usuario
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar datos extra
      await setDoc(doc(db, "users", user.uid), {
        email,
        username,
        phone,
        region,
        createdAt: new Date()
      });

      alert("Usuario creado 🔥");

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
        title="Crear cuenta"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 1.0s ease",
          background: "rgba(255,255,255,0.1)",
          color: "#fff",
        }}
      >
        <div className="p-fluid">
          <FloatLabel style={{ marginBottom: "1.5rem" }}>
            <InputText
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
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
            <InputText
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label htmlFor="username">Nickname</label>
          </FloatLabel>
          <FloatLabel style={{ marginBottom: "1.5rem" }}>
            <InputText
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
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

            <label htmlFor="region">
              Región
            </label>
          </FloatLabel>
          <Button
            label="Registrarse"
            icon="pi pi-user-plus"
            onClick={handleRegister}
            disabled={!email || !password || !username}
            className="p-button-success"
            style={{ width: "100%", marginBottom: "1rem" }}
          />
          <Button
            label="Ya tengo cuenta"
            icon="pi pi-sign-in"
            onClick={() => setShowLogin(true)}
            className="p-button-text"
          />
        </div>
      </Card>
    </div>
  );
}