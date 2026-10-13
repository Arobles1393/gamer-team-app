import { useState } from "react";
import Login from "./Login";
import Register from "./Register";

// initialMode "register": empieza en el registro en vez del login
export default function Auth({ onBack, initialMode }) {
  const [isLogin, setIsLogin] = useState(initialMode !== "register");

  return isLogin ? (
    <Login onToggleMode={() => setIsLogin(false)} onBack={onBack} />
  ) : (
    <Register onToggleMode={() => setIsLogin(true)} onBack={onBack} />
  );
}
