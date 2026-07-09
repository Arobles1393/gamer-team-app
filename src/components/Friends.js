import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import UserProfile from "./UserProfile";
import { sendFriendRequest } from "../services/friendService";
import { createOrGetChat } from "../services/chatService";

export default function Friends({ user, userData }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [friendStatus, setFriendStatus] = useState("none");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    loadFriends();

  }, [user]);

  useEffect(() => {
    if (!user || !selectedUserId) return;
  
    checkFriendStatus();
  
  }, [user, selectedUserId]);

  const loadFriends = async () => {
    try {
      const q = query(collection(db, "friends"), where("users", "array-contains", user.uid));
      const snapshot = await getDocs(q);
      const friendData = await Promise.all(
        snapshot.docs.map(async docSnap => {
          const users = docSnap.data().users;
          const friendId = users.find(uid => uid !== user.uid);
          const userDoc = await getDoc(doc(db, "users", friendId));

          return {
            uid: friendId,
            ...userDoc.data()
          };

        })
      );

      setFriends(friendData);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Cargando amigos...</p>;
  }

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
        Mis amigos
      </h2>
      {friends.length === 0 ? (
        <p>
          Aún no tienes amigos.
        </p>
      ) : (
        friends.map(friend => (
          <Card
            key={friend.uid}
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
                image={friend.avatar}
                label={friend.username?.charAt(0)}
                shape="circle"
                onClick={(e) => {
                  setSelectedUserId(friend.uid);
                  setShowProfile(true);
                }}
              />
              <div>
                <strong>
                  {friend.username}
                </strong>
                <p>
                  {friend.region}
                </p>
              </div>
            </div>
          </Card>
        ))
      )}
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