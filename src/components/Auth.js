import { useState } from "react";
import Login from "./Login";
import Register from "./Register";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-container">
        <video
            autoPlay
            loop
            muted
            playsInline
            className="bg-video"
        >
            <source src="/video/vidControl.mp4" type="video/mp4" />
        </video>
        <div className="overlay"/>
        {/* 🔐 CONTENIDO */}
        <div className="auth-content">
            {isLogin ? (
                <Login setShowLogin={setIsLogin} />
            ) : (
                <Register setShowLogin={setIsLogin} />
            )}
        </div>
    </div>
  );
}