import { Button } from "primereact/button";
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
    onCreatePost,
    onHome
}) {
    const menuRef = useRef(null);

    const avatarLabel = userData?.avatar ? null : userData?.username?.charAt(0).toUpperCase();
    const hasNotifications = unreadCount > 0;

    return(
        <header className="app-header">
            <div className="header-left">
                <h2 className="header-logo" onClick={onHome}>
                    GamerMatch
                </h2>
            </div>
            <div className="header-right">
                <div className="notification-container">
                <Button
                    icon="pi pi-bell"
                    rounded
                    text
                    onClick={onToggleNotifications}
                />

                {hasNotifications && (
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
                {userData?.username ?? user?.email}
                </span>
                <Menu model={items} popup ref={menuRef} />
                <Avatar
                image={userData?.avatar}
                label={avatarLabel}
                shape="circle"
                className="header-avatar"
                onClick={(e) => menuRef.current?.toggle(e)}
                size="large"
                />
            </div>
        </header>
    );
}