import { Dialog } from "primereact/dialog";
import { memo } from "react";
import UserProfile from "./UserProfile";
import UserProfileActions from "./UserProfileActions";
import "./UserProfile.css";

const DIALOG_PROPS = {
  className: "gm-dialog gm-dialog--bare gm-profile-dialog",
  maskClassName: "gm-dialog-mask",
  // El hero trae su propio botón de cerrar
  showHeader: false,
  style: { width: "1000px" },
  breakpoints: {
    "1100px": "94vw",
    "767px": "100vw"
  },
  dismissableMask: true,
  draggable: false,
  blockScroll: true
};

const UserProfileDialog = ({
  visible,
  onHide,
  selectedUserId,
  friendStatus,
  onSendFriendRequest,
  onChat
}) => {
  // El perfil propio nunca llega aquí: useProfileDialog manda a /profile
  if (!selectedUserId) {
    return null;
  }

  return (
    <Dialog
      {...DIALOG_PROPS}
      visible={visible}
      onHide={onHide}
      aria-label="Perfil de jugador"
    >
      <UserProfile
        userId={selectedUserId}
        onClose={onHide}
        actions={
          <UserProfileActions
            friendStatus={friendStatus}
            onSendFriendRequest={onSendFriendRequest}
            onChat={onChat}
          />
        }
      />
    </Dialog>
  );
};

export default memo(UserProfileDialog);
