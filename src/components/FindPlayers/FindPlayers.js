import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { UserProfileDialog } from "../UserProfile";
import { useFriendStatus, useProfileChat, useFriendRequest } from "../../hooks";

export default function FindPlayers({ user }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const { friendStatus, setFriendStatus } = useFriendStatus(
    user,
    selectedUserId
  );

  const { handleChat } = useProfileChat(user, selectedUserId, () =>
    setShowProfile(false)
  );

  const { handleFriendRequest } = useFriendRequest(
    user,
    selectedUserId,
    () => setFriendStatus("pending")
  );

  useEffect(() => {
    const loadUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setUsers(data);
    };

    loadUsers();
  }, []);

  const filteredUsers = users.filter(
    (player) =>
      player.id !== user?.uid &&
      player.username?.toLowerCase().includes(search.toLowerCase())
  );

  const openProfile = (playerId) => {
    setSelectedUserId(playerId);
    setShowProfile(true);
  };

  return (
    <div>
      <h2>Buscar jugadores</h2>

      <InputText
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar usuario..."
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      {filteredUsers.map((player) => (
        <Card key={player.id} style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Avatar
              image={player.avatar}
              label={player.username?.charAt(0)}
              shape="circle"
              onClick={() => openProfile(player.id)}
            />

            <div>
              <strong>{player.username}</strong>
              <p>{player.region}</p>
            </div>
          </div>
        </Card>
      ))}

      <UserProfileDialog
        visible={showProfile}
        onHide={() => {
          setShowProfile(false);
          setSelectedUserId(null);
        }}
        selectedUserId={selectedUserId}
        user={user}
        friendStatus={friendStatus}
        onSendFriendRequest={handleFriendRequest}
        onChat={handleChat}
      />
    </div>
  );
}