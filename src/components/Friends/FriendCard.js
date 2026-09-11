import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { useUserProfile } from "../../hooks";

export default function FriendCard({ friendId, onClick }) {
  const { userData: friend } = useUserProfile(friendId);

  return (
    <Card style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Avatar
          image={friend?.avatar}
          label={friend?.username?.charAt(0)}
          shape="circle"
          onClick={onClick}
        />
        <div>
          <strong>{friend?.username}</strong>
          <p>{friend?.region}</p>
        </div>
      </div>
    </Card>
  );
}