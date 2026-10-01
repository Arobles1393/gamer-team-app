import { useState, useRef } from "react";
import { logout } from "./services/auth";
import { AppHeader, createHeaderMenu } from "./components/Header";
import { NotificationOverlay } from "./components/Notifications";
import { notificationService } from "./services/notifications";
import { friendService } from "./services/friends";
import { useNotifications, useUnreadNotifications, useUserPresence, useRequireAuth, useWelcomeNotice } from "./hooks";
import { useAuthReady, useCurrentUser } from "./context";
import { AppRoutes } from "./routes";
import { CreatePostDialog } from "./components/Posts";
import { useNavigate } from "react-router-dom"
import { Toast } from "primereact/toast";
import { useTranslation } from "react-i18next";
import { resetAppLanguage } from "./i18n";
import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/confirm.css";
import "./styles/dialog.css";
import "./styles/buttons.css";
import "./styles/forms.css";

function App() {
  // UI State
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Refs
  const notificationRef = useRef(null);
  const toast = useRef(null);

  // Navigation
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Hooks
  const user = useCurrentUser();
  const authReady = useAuthReady();
  const requireAuth = useRequireAuth(user);
  const { notifications, loading: loadingNotifications } = useNotifications(user, { limitCount: 10 });
  // Badge y punto rosa en "Chats" del rail: cuentan todas las no leídas, no solo las 10 del overlay
  const { unreadCount, hasUnreadMessages } = useUnreadNotifications(user);
  useUserPresence(user);
  // "Cuenta creada": el formulario de registro ya no está en pantalla
  useWelcomeNotice(user, () => {
    toast.current?.show({
      severity: "success",
      summary: t("auth:register.createdTitle"),
      detail: t("auth:register.createdDetail"),
      life: 4000
    });
  });

  // UI Handlers
  const handleToggleNotifications = (e) => {
    if (!requireAuth()) return;
    notificationRef.current?.toggle(e);
  };
  const handleCloseCreatePost = () => { setShowCreatePost(false); setEditingPost(null); };
  const handleAcceptFriendRequest = (notification) => {
    return friendService.acceptFriendRequest(
      notification,
      user
    );
  };

  const handleRejectFriendRequest = (notification) => {
    return friendService.rejectFriendRequest(
      notification
    );
  };

  const handleMarkNotificationAsRead = (notificationId) => {
    return notificationService.markNotificationAsRead(
      notificationId
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    return notificationService.markAllNotificationsAsRead(
      user.uid
    );
  };

  // Evita mostrar la vista de visitante (o redirigir al login) mientras
  // Firebase todavía no confirma si hay sesión
  if (!authReady) {
    return null;
  }

  // Al cerrar sesión se vuelve al feed (público) en vez de quedar en una
  // página privada que mandaría al login
  // El idioma elegido por esta cuenta se olvida: la siguiente sesión
  // empieza con el del navegador (o el guardado en su propia cuenta)
  const handleLogout = () => {
    navigate("/");
    logout();
    resetAppLanguage();
  };

  const items = createHeaderMenu(
    navigate,
    handleLogout,
    t
  );

  return (
    <>
      <AppHeader
        unreadCount={unreadCount}
        hasUnreadMessages={hasUnreadMessages}
        items={items}
        onToggleNotifications={handleToggleNotifications}
        onLogin={user ? undefined : requireAuth}
      />
      {user && (
        <>
          <NotificationOverlay
            notificationRef={notificationRef}
            notifications={notifications}
            loading={loadingNotifications}
            unreadCount={unreadCount}
            onAccept={handleAcceptFriendRequest}
            onReject={handleRejectFriendRequest}
            onMarkAsRead={handleMarkNotificationAsRead}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          />
          <CreatePostDialog
            visible={showCreatePost}
            editingPost={editingPost}
            onHide={handleCloseCreatePost}
            onClose={handleCloseCreatePost}
          />
        </>
      )}
      <main className="app-content">
        <AppRoutes
          setEditingPost={setEditingPost}
          setShowCreatePost={setShowCreatePost}
        />
      </main>
      <Toast ref={toast} />
    </>
  );
}

export default App;
