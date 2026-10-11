import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { USERNAME_MAX } from "../../constants";
import "./AgeGate.css";

// Mensaje de cada error de finishUsername
const ERROR_KEYS = {
  "auth/username-taken": "usernamePrompt.taken",
  "profile/username-required": "usernamePrompt.required",
  invalid: "usernamePrompt.invalid"
};

/**
 * "Elige tu apodo": primer inicio con Google (y perfiles rehechos), que
 * empiezan con un apodo genérico para no publicar el nombre real. El campo
 * empieza vacío. "Ahora no" se queda con el genérico (current); se puede
 * cambiar después en Mi perfil.
 * onFinish(username | null) devuelve null si salió bien o un código de error
 */
export default function UsernameDialog({ visible, current, saving, onFinish }) {
  const { t } = useTranslation("auth");
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setValue("");
      setError(null);
    }
  }, [visible]);

  const finish = async (username) => {
    setError(null);
    // "/" no puede ir en el id de la reserva (usernames/{nombre})
    if (username !== null && username.includes("/")) {
      setError("invalid");
      return;
    }
    const code = await onFinish(username);
    if (code) setError(code);
  };

  return (
    <Dialog
      visible={visible}
      onHide={() => {}}
      header={t("usernamePrompt.title")}
      className="gm-dialog age-gate username-prompt"
      maskClassName="gm-dialog-mask"
      modal
      closable={false}
      closeOnEscape={false}
      draggable={false}
      resizable={false}
    >
      <form
        className="age-gate__body username-prompt__form"
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) finish(value);
        }}
      >
        <span className="age-gate__icon" aria-hidden="true">
          <i className="pi pi-user-edit" />
        </span>
        <p>{t("usernamePrompt.text")}</p>
        <label htmlFor="username-prompt-input" className="username-prompt__label">
          {t("usernamePrompt.label")}
        </label>
        <InputText
          id="username-prompt-input"
          value={value}
          maxLength={USERNAME_MAX}
          autoComplete="nickname"
          placeholder={t("usernamePrompt.placeholder")}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby="username-prompt-hint"
          aria-invalid={Boolean(error)}
          autoFocus
        />
        <p id="username-prompt-hint" className="age-gate__legal">
          {t("usernamePrompt.hint", { current })}
        </p>
        {error && (
          <p className="age-gate__error" role="alert">
            {t(ERROR_KEYS[error] ?? "usernamePrompt.error")}
          </p>
        )}
        <div className="age-gate__actions">
          <Button
            type="button"
            label={t("usernamePrompt.skip")}
            className="gm-btn gm-btn--ghost"
            disabled={saving}
            onClick={() => finish(null)}
          />
          <Button
            type="submit"
            label={t("usernamePrompt.save")}
            className="gm-btn gm-btn--primary"
            loading={saving}
            disabled={!value.trim()}
          />
        </div>
      </form>
    </Dialog>
  );
}
