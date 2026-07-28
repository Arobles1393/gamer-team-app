import { Dialog } from "primereact/dialog";
import { memo } from "react";
import UserProfile from "./UserProfile";
import UserProfileActions from "./UserProfileActions";

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

  const isOwnProfile = user?.uid === selectedUserId;

  return (
    <Dialog
      pt={{
        header: { style: { padding: 0 } }
      }}
      visible={visible}
      style={{ width: "1100px" }}
      onHide={onHide}
      breakpoints={{ "960px": "75vw", "640px": "90vw" }}
      dismissableMask
      draggable={false}
    >
      <div className="profile-container">
        <UserProfile
          userId={selectedUserId}
          user={user}
        />
        {!isOwnProfile && (
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