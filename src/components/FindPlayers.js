import { useEffect, useState } from "react";
import { collection, getDocs, query, where, } from "firebase/firestore";
import { db } from "../firebase/config";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { sendFriendRequest } from "../services/friendService";
import { useNavigate } from "react-router-dom";
import { createOrGetChat } from "../services/chatService";
import UserProfile from "./UserProfile";

export default function FindPlayers({ user, userData }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [friendStatus, setFriendStatus] = useState("none");
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
      const snapshot = await getDocs(
        collection(db, "users")
      );

      const data =
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      setUsers(data);

    };

    loadUsers();

  }, []);

  useEffect(() => {
    if (!user || !selectedUserId) return;
  
    checkFriendStatus();
  
  }, [user, selectedUserId]);

  const filteredUsers = users.filter(
    player =>
    player.id !== user?.uid &&
    player.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleChat = async () => {
    const chatId = await createOrGetChat(user, {
      uid: selectedUserId
    });
  
    navigate("/chat", {
      state: { chatId }
    });

    setShowProfile(false);
  };

  const checkFriendStatus = async () => {
    
    // Revisar amistad

    const friendsQuery = query(
      collection(db, "friends"),
      where("users", "array-contains", user.uid)
    );

    const friendsSnap = await getDocs(friendsQuery);

    const isFriend =
      friendsSnap.docs.some(doc =>
        doc.data().users.includes(
          selectedUserId
        )
      );

    if (isFriend) {
      setFriendStatus("friends");
      return;
    }

    // Revisar solicitud pendiente

    const requestQuery = query(
      collection(db, "friend_requests"),
      where("senderId", "==", user.uid),
      where(
        "receiverId",
        "==",
        selectedUserId
      ),
      where("status", "==", "pending")
    );

    const requestSnap = await getDocs(requestQuery);

    if (!requestSnap.empty) {
      setFriendStatus("pending");
      return;
    }

    setFriendStatus("none");
  };

  return (
    <div>

      <h2>
        Buscar jugadores
      </h2>

      <InputText
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        placeholder="Buscar usuario..."
        style={{
          width: "100%",
          marginBottom: "1rem"
        }}
      />

      {filteredUsers.map(player => (

        <Card
          key={player.id}
          style={{
            marginBottom: "1rem"
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem"
            }}
          >

            <Avatar
              image={player.avatar}
              label={
                player.username?.charAt(0)
              }
              shape="circle"
              onClick={(e) => {
                setSelectedUserId(player.id);
                setShowProfile(true);
              }}
            />

            <div>

              <strong>
                {player.username}
              </strong>

              <p>
                {player.region}
              </p>

            </div>

          </div>

        </Card>

      ))}

      <Dialog
        pt={{
          header: { style: { padding: 0 } }
        }}
        visible={showProfile}
        style={{ width: "1100px" }}
        onHide={() => {
          setShowProfile(false);
          setSelectedUserId(null);
          setFriendStatus("none");
        }}
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
        dismissableMask
        draggable={false}
      >
        {selectedUserId && (
          <div className="profile-container">
            <UserProfile userId={selectedUserId} user={user} />
            {user.uid !== selectedUserId && (
              <>
                {friendStatus === "none" && (
                  <Button
                    label="Agregar amigo"
                    icon="pi pi-user-plus"
                    onClick={async () => {

                      await sendFriendRequest(
                        user,
                        userData,
                        selectedUserId
                      );

                      setFriendStatus(
                        "pending"
                      );
                    }}
                  />
                )}
                {friendStatus === "pending" && (
                  <Button
                    label="Solicitud enviada"
                    icon="pi pi-clock"
                    disabled
                  />
                )}
                {friendStatus === "friends" && (
                  <Button
                    label="Amigos"
                    icon="pi pi-check"
                    severity="success"
                    disabled
                  />
                )}
                <Button
                  icon="pi pi-comments"
                  className="chat-fab p-button-rounded p-button-success"
                  onClick={handleChat}
                />
              </>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}