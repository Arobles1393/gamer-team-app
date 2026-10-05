import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { useDeleteAccount } from "../../hooks";

const DELETED_ITEMS = ["profile", "posts", "comments", "chats", "friends", "files"];

// Confirmación de "Eliminar mi cuenta": explica qué se borra, que es
// irreversible, y pide escribir el nickname exacto (y la contraseña en
// cuentas con contraseña; Google y Steam abren su ventana de inicio de
// sesión). No se puede cerrar mientras se está borrando.
export default function DeleteAccountDialog({ visible, onHide, user, username, onError }) {
  const { t } = useTranslation("profile");
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const { deleteAccount, deleting, method } = useDeleteAccount(user, onError);

  const matches = confirmation === username;
  const canDelete = matches && (method !== "password" || password.length > 0) && !deleting;

  const close = () => {
    if (deleting) return;
    setConfirmation("");
    setPassword("");
    onHide();
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    await deleteAccount({ password });
  };

  return (
    <Dialog
      visible={visible}
      onHide={close}
      header={t("danger.dialogTitle")}
      className="gm-dialog delete-account"
      modal
      closable={!deleting}
      closeOnEscape={!deleting}
      dismissableMask={!deleting}
      draggable={false}
      resizable={false}
    >
      <div className="delete-account__body">
        <p className="delete-account__warning">
          <i className="pi pi-exclamation-triangle" aria-hidden="true" />
          {t("danger.irreversible")}
        </p>

        <p className="delete-account__intro">{t("danger.whatIsDeleted")}</p>
        <ul className="delete-account__list">
          {DELETED_ITEMS.map((item) => <li key={item}>{t(`danger.items.${item}`)}</li>)}
        </ul>
        <p className="delete-account__note">{t("danger.chatsNote")}</p>

        <div className="gm-field">
          <label className="gm-field__label" htmlFor="delete-confirm">
            {t("danger.typeUsername", { username })}
          </label>
          <InputText
            id="delete-confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
            disabled={deleting}
            className="gm-input"
          />
        </div>

        {method === "password" ? (
          <div className="gm-field">
            <label className="gm-field__label" htmlFor="delete-password">{t("danger.password")}</label>
            <Password
              inputId="delete-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              feedback={false}
              toggleMask
              disabled={deleting}
              autoComplete="current-password"
              className="delete-account__password"
              inputClassName="gm-input"
            />
          </div>
        ) : (
          <p className="delete-account__note">{t(`danger.reauth.${method}`)}</p>
        )}
      </div>

      <div className="delete-account__actions">
        <Button
          label={t("common:actions.cancel")}
          className="gm-btn gm-btn--ghost"
          disabled={deleting}
          onClick={close}
        />
        <Button
          label={deleting ? t("danger.deleting") : t("danger.confirm")}
          icon={deleting ? "pi pi-spin pi-spinner" : "pi pi-trash"}
          className="gm-btn gm-btn--danger"
          disabled={!canDelete}
          onClick={handleDelete}
        />
      </div>
    </Dialog>
  );
}
