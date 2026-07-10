import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { Menu } from "primereact/menu";
import { Avatar } from "primereact/avatar";
import { useRef } from "react";

export default function AppHeader({
    user,
    userData,
    unreadCount,
    items,
    onToggleNotifications,
    onCreatePost
}) {
    const menuRef = useRef(null);
    const navigate = useNavigate();

    return(
        <header className="app-header">
            <div className="header-left">
                <h2 onClick={() => navigate("/")}>
                GamerMatch
                </h2>
            </div>
            <div className="header-right">
                <div
                style={{
                    position: "relative"
                }}
                >
                <Button
                    icon="pi pi-bell"
                    rounded
                    text
                    onClick={onToggleNotifications}
                />

                {unreadCount > 0 && (
                    <span className="notification-badge">
                    {unreadCount}
                    </span>
                )}
                </div>
                <Button
                label="Publicar"
                icon="pi pi-plus"
                className="publish-btn-floating"
                onClick={onCreatePost}
                />
                <span className="username">
                {userData?.username || user.email}
                </span>
                <Menu model={items} popup ref={menuRef} />
                <Avatar
                image={userData?.avatar}
                label={
                    !userData?.avatar
                    ? userData?.username?.charAt(0).toUpperCase()
                    : null
                }
                shape="circle"
                style={{ backgroundColor: "#6366f1", color: "#fff", cursor: "pointer" }}
                onClick={(e) => menuRef.current?.toggle(e)}
                size="large"
                />
            </div>
        </header>
    );
}