import { useState } from "react";
import Login from "./Login";
import Register from "./Register";

export default function Auth({ onBack }) {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <Login onToggleMode={() => setIsLogin(false)} onBack={onBack} />
  ) : (
    <Register onToggleMode={() => setIsLogin(true)} onBack={onBack} />
  );
}
