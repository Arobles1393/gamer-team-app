import { memo } from "react";
import { Button } from "primereact/button";

const FRIEND_BUTTONS = {
  none: {
    label: "Agregar amigo",
    icon: "pi pi-user-plus"
  },
  pending: {
    label: "Solicitud enviada",
    icon: "pi pi-clock",
    disabled: true
  },
  friends: {
    label: "Amigos",
    icon: "pi pi-check",
    severity: "success",
    disabled: true
  }
};

function UserProfileActions({
  friendStatus,
  onSendFriendRequest,
  onChat
}) {
  const button = FRIEND_BUTTONS[friendStatus];

  return (
    <>
      {button && (
        <Button
          {...button}
          onClick={
            friendStatus === "none"
              ? onSendFriendRequest
              : undefined
          }
        />
      )}

      <Button
        icon="pi pi-comments"
        className="chat-fab p-button-rounded p-button-success"
        onClick={onChat}
      />
    </>
  );
};

export default memo(UserProfileActions);