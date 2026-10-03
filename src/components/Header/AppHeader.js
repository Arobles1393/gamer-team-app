import { Menu } from "primereact/menu";
import { UserAvatar } from "../UserAvatar";
import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  adminPendingCount = 0,
  onToggleNotifications,
  onLogin
}) {
  const { t } = useTranslation();
  const menuRef = useRef(null);
  const userData = useCurrentUserData();

  // Handlers
  const handleToggleMenu = (event) => {
    menuRef.current?.toggle(event);
  };

  return (
    <nav className="app-rail" aria-label={t("nav.main")}>
      <NavLink to="/" className="app-rail__logo" aria-label={t("nav.homeLogo")}>
        GM
      </NavLink>

      <div className="app-rail__nav">
        <RailButton to="/" end icon="pi-home" label={t("nav.home")} />
        <RailButton to="/findPlayers" icon="pi-search" label={t("nav.findPlayers")} />
        <RailButton to="/friends" icon="pi-users" label={t("nav.friends")} />
        <RailButton to="/chat" icon="pi-comments" label={t("nav.chats")} dot={hasUnreadMessages} />
        <RailButton to="/guias" icon="pi-book" label={t("nav.guides")} />
        <RailButton to="/news" icon="pi-megaphone" label={t("nav.news")} />
        <RailButton
          icon="pi-bell"
          label={t("nav.notifications")}
          badge={unreadCount}
          onClick={onToggleNotifications}
        />
      </div>

      <div className="app-rail__spacer" />

      {onLogin ? (
        <RailButton
          icon="pi-sign-in"
          label={t("actions.login")}
          className="rail-btn--login"
          onClick={onLogin}
        />
      ) : (
        <>
          <Menu ref={menuRef} model={items} popup className="gm-menu" />
          <button
            type="button"
            className="app-rail__avatar-btn"
            aria-label={adminPendingCount > 0
              ? t("nav.accountMenuPending", { count: adminPendingCount })
              : t("nav.accountMenu")}
            aria-haspopup="menu"
            onClick={handleToggleMenu}
          >
            <UserAvatar
              image={userData?.avatar}
              username={userData?.username}
              className="app-rail__avatar"
            />
            {adminPendingCount > 0 && <span className="rail-btn__dot app-rail__avatar-dot" aria-hidden="true" />}
          </button>
        </>
      )}
    </nav>
  );
}
