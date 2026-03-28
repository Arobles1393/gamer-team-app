import { useState } from "react";
import { auth, db } from "../firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

export default function Register({ setShowLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  const handleRegister = async () => {
    if (!email || !password || !username) {
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
        createdAt: new Date()
      });

      alert("Usuario creado 🔥");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <h2>Registro</h2>

      <input placeholder="Correo" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} />
      <input placeholder="Nickname" onChange={(e) => setUsername(e.target.value)} />
      <input placeholder="Teléfono (521...)" onChange={(e) => setPhone(e.target.value)} />

      <button onClick={handleRegister}>Registrarse</button>

      <p onClick={() => setShowLogin(true)} style={{ cursor: "pointer" }}>
        ¿Ya tienes cuenta? Inicia sesión
      </p>
    </div>
  );
}