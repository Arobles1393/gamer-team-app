import { useState } from "react";
import { UserProfileDialog } from "../UserProfile";
import { friendService } from "../../services/friends";
import FriendCard from "./FriendCard";
import { useFriends, useFriendStatus, useProfileChat } from "../../hooks";

export default function Friends({ user }) {
  const { friendIds, loading } = useFriends(user);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const { friendStatus, setFriendStatus } = useFriendStatus(
    user,
    selectedUserId
  );

  const { handleChat } = useProfileChat(user, selectedUserId, () =>
    setShowProfile(false)
  );

  if (loading) {
    return <p>Cargando amigos...</p>;
  }

  const openProfile = (friendId) => {
    setSelectedUserId(friendId);
    setShowProfile(true);
  };

  return (
    <div>
      <h2>Mis amigos</h2>

      {friendIds.length === 0 ? (
        <p>Aún no tienes amigos.</p>
      ) : (
        friendIds.map((friendId) => (
          <FriendCard
            key={friendId}
            friendId={friendId}
            onClick={() => openProfile(friendId)}
          />
        ))
      )}

      <UserProfileDialog
        visible={showProfile}
        onHide={() => {
          setShowProfile(false);
          setSelectedUserId(null);
        }}
        selectedUserId={selectedUserId}
        user={user}
        friendStatus={friendStatus}
        onSendFriendRequest={async () => {
          await friendService.sendFriendRequest(user, selectedUserId);
          setFriendStatus("pending");
        }}
        onChat={handleChat}
      />
    </div>
  );
}