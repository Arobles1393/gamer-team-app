import { memo, useState } from "react";
import { Button } from "primereact/button";

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
  friendStatus,
  isOwnProfile = false,
  onSendFriendRequest,
  onChat,
  onEditProfile
}) {
  const [sendingRequest, setSendingRequest] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  if (isOwnProfile) {
    return (
      <Button
        label="Editar mi perfil"
        icon="pi pi-pencil"
        className="gm-btn gm-btn--primary"
        onClick={onEditProfile}
      />
    );
  }

  const action = FRIEND_ACTIONS[friendStatus];
  const badge = FRIEND_BADGES[friendStatus];

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

  return (
    <>
      {badge && (
        <span className={`user-profile__badge user-profile__badge--${friendStatus}`}>
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
      <Button
        label="Mensaje"
        icon="pi pi-comments"
        className={`gm-btn ${action ? "gm-btn--ghost" : "gm-btn--primary"}`}
        loading={openingChat}
        onClick={handleChat}
      />
    </>
  );
}

export default memo(UserProfileActions);
