import { Button } from "primereact/button";

// Ocupa el lugar del CommentInput para visitantes sin sesión
export default function CommentLoginPrompt({ onLogin }) {
  return (
    <div className="comment-login">
      <p className="comment-login__text">
        Inicia sesión para comentar y coordinar la partida.
      </p>
      <Button
        label="Iniciar sesión"
        icon="pi pi-sign-in"
        className="gm-btn gm-btn--ghost comment-login__btn"
        onClick={onLogin}
      />
    </div>
  );
}
