import { memo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";

// Acción principal según la relación de amistad
const FRIEND_ACTIONS = {
  none: { label: "Agregar amigo", icon: "pi pi-user-plus" },
  received: { label: "Aceptar solicitud", icon: "pi pi-user-plus" }
};

// Estados que no tienen acción: se muestran como etiqueta
const FRIEND_BADGES = {
  pending: { label: "Solicitud enviada", icon: "pi-clock" },
  friends: { label: "Amigos", icon: "pi-check" }
};

function UserProfileActions({
  username,
  friendStatus,
  blocked = false,
  blockedByMe = false,
  onSendFriendRequest,
  onChat,
  onRemoveFriend,
  onBlock,
  onUnblock,
  onReport
}) {
  const menuRef = useRef(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  // Con un bloqueo (en cualquier dirección) no hay amistad ni chat posibles
  const action = blocked ? null : FRIEND_ACTIONS[friendStatus];
  const badge = blocked
    ? { label: blockedByMe ? "Bloqueado" : "No disponible", icon: "pi-ban" }
    : FRIEND_BADGES[friendStatus];
  const name = username || "este usuario";

  const handleFriendRequest = async () => {
    setSendingRequest(true);

    try {
      await onSendFriendRequest();
    } finally {
      setSendingRequest(false);
    }
  };

  const handleChat = async () => {
    setOpeningChat(true);

    try {
      await onChat();
    } finally {
      setOpeningChat(false);
    }
  };

  // Opciones del menú "⋮" según la relación actual
  const menuItems = [
    !blocked && friendStatus === "friends" && {
      label: "Dejar de ser amigos",
      icon: "pi pi-user-minus",
      command: onRemoveFriend
    },
    blockedByMe
      ? { label: `Desbloquear a ${name}`, icon: "pi pi-lock-open", command: onUnblock }
      // Si el otro me bloqueó a mí no hay nada que bloquear ni desbloquear
      : !blocked && {
        label: `Bloquear a ${name}`,
        icon: "pi pi-ban",
        className: "gm-menu__danger",
        command: onBlock
      },
    {
      label: `Reportar a ${name}`,
      icon: "pi pi-flag",
      className: "gm-menu__danger",
      command: onReport
    }
  ].filter(Boolean);

  return (
    <>
      {badge && (
        <span className={`user-profile__badge user-profile__badge--${blocked ? "blocked" : friendStatus}`}>
          <i className={`pi ${badge.icon}`} aria-hidden="true" />
          {badge.label}
        </span>
      )}

      {action && (
        <Button
          label={action.label}
          icon={action.icon}
          className="gm-btn gm-btn--primary"
          loading={sendingRequest}
          onClick={handleFriendRequest}
        />
      )}

      {/* Si ya no hay nada que hacer con la amistad, Mensaje pasa a ser la acción principal */}
      {!blocked && (
        <Button
          label="Mensaje"
          icon="pi pi-comments"
          className={`gm-btn ${action ? "gm-btn--ghost" : "gm-btn--primary"}`}
          loading={openingChat}
          onClick={handleChat}
        />
      )}

      <Menu ref={menuRef} model={menuItems} popup className="gm-menu" />
      <Button
        icon="pi pi-ellipsis-v"
        className="gm-btn gm-btn--ghost user-profile__more"
        aria-label="Más opciones"
        aria-haspopup="menu"
        onClick={(event) => menuRef.current?.toggle(event)}
      />
    </>
  );
}

export default memo(UserProfileActions);
