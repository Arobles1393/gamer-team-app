import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { Menu } from "primereact/menu";
import { Avatar } from "primereact/avatar";
import { useRef } from "react";
import "./Header.css";

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
                <div className="header-logo">
                    <h2 onClick={() => navigate("/")}>
                        GamerMatch
                    </h2>
                </div>
            </div>
            <div className="header-right">
                <div className="notification-container">
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
                className="header-publish-btn"
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
                className="header-avatar"
                onClick={(e) => menuRef.current?.toggle(e)}
                size="large"
                />
            </div>
        </header>
    );
}