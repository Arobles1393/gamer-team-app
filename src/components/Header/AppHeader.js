import { Menu } from "primereact/menu";
import { UserAvatar } from "../UserAvatar";
import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { useCurrentUserData } from "../../context";
import RailButton from "./RailButton";
import "./Header.css";

/**
 * Navegación principal: rail vertical fijo a la izquierda en desktop,
 * barra inferior fija en mobile. Sin sesión (onLogin) muestra el botón de
 * iniciar sesión en lugar del avatar.
 */
export default function AppHeader({
  unreadCount,
  hasUnreadMessages,
  items,
  onToggleNotifications,
  onLogin
}) {
  const menuRef = useRef(null);
  const userData = useCurrentUserData();

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
        <RailButton to="/news" icon="pi-megaphone" label="Noticias" />
        <RailButton
          icon="pi-bell"
          label="Notificaciones"
          badge={unreadCount}
          onClick={onToggleNotifications}
        />
      </div>

      <div className="app-rail__spacer" />

      {onLogin ? (
        <RailButton
          icon="pi-sign-in"
          label="Iniciar sesión"
          className="rail-btn--login"
          onClick={onLogin}
        />
      ) : (
        <>
          <Menu ref={menuRef} model={items} popup className="gm-menu" />
          <button
            type="button"
            className="app-rail__avatar-btn"
            aria-label="Menú de cuenta"
            aria-haspopup="menu"
            onClick={handleToggleMenu}
          >
            <UserAvatar
              image={userData?.avatar}
              username={userData?.username}
              className="app-rail__avatar"
            />
          </button>
        </>
      )}
    </nav>
  );
}
