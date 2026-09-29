import { Dialog } from "primereact/dialog";
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import UserProfile from "./UserProfile";
import UserProfileActions from "./UserProfileActions";
import { useCurrentUser } from "../../context";
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
  const user = useCurrentUser();
  const navigate = useNavigate();

  if (!selectedUserId) {
    return null;
  }

  const isOwnProfile = user?.uid === selectedUserId;

  const handleEditProfile = () => {
    onHide();
    navigate("/profile");
  };

  return (
    <Dialog
      {...DIALOG_PROPS}
      visible={visible}
      onHide={onHide}
      aria-label="Perfil de jugador"
    >
      <UserProfile
        userId={selectedUserId}
        isOwnProfile={isOwnProfile}
        onClose={onHide}
        actions={
          <UserProfileActions
            friendStatus={friendStatus}
            isOwnProfile={isOwnProfile}
            onSendFriendRequest={onSendFriendRequest}
            onChat={onChat}
            onEditProfile={handleEditProfile}
          />
        }
      />
    </Dialog>
  );
};

export default memo(UserProfileDialog);
