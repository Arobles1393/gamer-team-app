import { Menu } from "primereact/menu";
import { Avatar } from "primereact/avatar";
import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { useCurrentUserData } from "../../context";
import RailButton from "./RailButton";
import "./Header.css";

/**
 * Navegación principal: rail vertical fijo a la izquierda en desktop,
 * barra inferior fija en mobile.
 */
export default function AppHeader({
  unreadCount,
  hasUnreadMessages,
  items,
  onToggleNotifications
}) {
  const menuRef = useRef(null);
  const userData = useCurrentUserData();

  // Valores derivados
  const avatarLabel = !userData?.avatar ? userData?.username?.charAt(0).toUpperCase() : null;

  // Handlers
  const handleToggleMenu = (event) => {
    menuRef.current?.toggle(event);
  };

  return (
    <nav className="app-rail" aria-label="Navegación principal">
      <NavLink to="/" className="app-rail__logo" aria-label="GamerMatch — inicio">
        GM
      </NavLink>

      <div className="app-rail__nav">
        <RailButton to="/" end icon="pi-home" label="Inicio" />
        <RailButton to="/findPlayers" icon="pi-search" label="Buscar jugadores" />
        <RailButton to="/friends" icon="pi-users" label="Amigos" />
        <RailButton to="/chat" icon="pi-comments" label="Chats" dot={hasUnreadMessages} />
        <RailButton
          icon="pi-bell"
          label="Notificaciones"
          badge={unreadCount}
          onClick={onToggleNotifications}
        />
      </div>

      <div className="app-rail__spacer" />

      <Menu ref={menuRef} model={items} popup className="gm-menu" />
      <button
        type="button"
        className="app-rail__avatar-btn"
        aria-label="Menú de cuenta"
        aria-haspopup="menu"
        onClick={handleToggleMenu}
      >
        <Avatar
          image={userData?.avatar}
          label={avatarLabel}
          shape="circle"
          className="app-rail__avatar"
        />
      </button>
    </nav>
  );
}
