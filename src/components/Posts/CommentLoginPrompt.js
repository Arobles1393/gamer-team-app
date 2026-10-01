import { Button } from "primereact/button";
import { useTranslation } from "react-i18next";

// Ocupa el lugar del CommentInput para visitantes sin sesión
export default function CommentLoginPrompt({ onLogin }) {
  const { t } = useTranslation("posts");

  return (
    <div className="comment-login">
      <p className="comment-login__text">
        {t("comments.loginPrompt")}
      </p>
      <Button
        label={t("common:actions.login")}
        icon="pi pi-sign-in"
        className="gm-btn gm-btn--ghost comment-login__btn"
        onClick={onLogin}
      />
    </div>
  );
}
