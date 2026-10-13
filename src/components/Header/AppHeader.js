import { Menu } from "primereact/menu";
import { UserAvatar } from "../UserAvatar";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentUserData } from "../../context";
import RailButton from "./RailButton";
import "./Header.css";

// Rail expandido (con los nombres) o contraído (solo iconos): preferencia de
// este navegador. Sin almacenamiento disponible, empieza contraído
const RAIL_KEY = "gm-rail-expanded";
const readExpanded = () => {
  try {
    return localStorage.getItem(RAIL_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * Navegación principal: rail vertical fijo a la izquierda en desktop,
 * barra inferior fija en mobile. Sin sesión (onLogin) muestra el botón de
 * iniciar sesión en lugar del avatar.
 * En desktop el logo lleva al inicio (no hay icono de Inicio) y el rail se
 * expande o contrae con su botón; la clase gm-rail-expanded en <html> cambia
 * --gm-rail-width para que el contenido se aparte (styles/layout.css).
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
  const [expanded, setExpanded] = useState(readExpanded);

  useEffect(() => {
    document.documentElement.classList.toggle("gm-rail-expanded", expanded);
    try {
      localStorage.setItem(RAIL_KEY, expanded ? "1" : "0");
    } catch {
      // Sin almacenamiento: vale solo para esta visita
    }
    return () => document.documentElement.classList.remove("gm-rail-expanded");
  }, [expanded]);

  // Handlers
  const handleToggleMenu = (event) => {
    menuRef.current?.toggle(event);
  };

  return (
    <nav className={`app-rail${expanded ? " app-rail--expanded" : ""}`} aria-label={t("nav.main")}>
      <NavLink to="/" className="app-rail__brand" aria-label={t("nav.homeLogo")}>
        <span className="app-rail__logo" aria-hidden="true">GM</span>
        <span className="app-rail__wordmark" aria-hidden="true">GamerMatch</span>
      </NavLink>

      <div className="app-rail__nav" id="app-rail-nav">
        {/* Inicio solo en mobile: en desktop lleva el logo */}
        <RailButton to="/" end icon="pi-home" label={t("nav.home")} className="rail-btn--home" />
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

      <button
        type="button"
        className="rail-btn app-rail__toggle"
        aria-expanded={expanded}
        aria-controls="app-rail-nav"
        aria-label={expanded ? t("nav.collapse") : t("nav.expand")}
        title={expanded ? t("nav.collapse") : t("nav.expand")}
        onClick={() => setExpanded((value) => !value)}
      >
        <i className={`pi ${expanded ? "pi-angle-double-left" : "pi-angle-double-right"}`} aria-hidden="true" />
        <span className="rail-btn__label" aria-hidden="true">{t("nav.collapse")}</span>
      </button>

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
            <span className="app-rail__avatar-name" aria-hidden="true">{userData?.username}</span>
            {adminPendingCount > 0 && <span className="rail-btn__dot app-rail__avatar-dot" aria-hidden="true" />}
          </button>
        </>
      )}
    </nav>
  );
}
