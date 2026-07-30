import { Dialog } from "primereact/dialog";
import { memo } from "react";
import UserProfile from "./UserProfile";
import UserProfileActions from "./UserProfileActions";

const DIALOG_PT = {
  header: {
    style: { padding: 0 }
  }
};

const DIALOG_PROPS = {
  pt: DIALOG_PT,
  style: { width: "1100px" },
  breakpoints: {
    "960px": "75vw",
    "640px": "90vw"
  },
  dismissableMask: true,
  draggable: false
};

const UserProfileDialog = ({
  visible,
  onHide,
  selectedUserId,
  user,
  friendStatus,
  onSendFriendRequest,
  onChat
}) => {

  if (!selectedUserId) {
    return null;
  }

  return (
    <Dialog
      {...DIALOG_PROPS}
      visible={visible}
      onHide={onHide}
    >
      <div className="profile-container">
        <UserProfile
          userId={selectedUserId}
          user={user}
        />
        {user?.uid !== selectedUserId && (
          <UserProfileActions
            friendStatus={friendStatus}
            onSendFriendRequest={onSendFriendRequest}
            onChat={onChat}
          />
        )}
      </div>
    </Dialog>
  );
};

export default memo(UserProfileDialog)