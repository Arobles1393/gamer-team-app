import { useEffect, useState, useRef } from "react";
import { EmailVerificationBanner } from "./components/EmailVerification";
import { subscribeToAppNotices } from "./utils/appNotice";
import { useOpenOnboarding } from "./components/Onboarding";
import { clearOnboardingSession } from "./hooks/onboarding/useOnboarding";
import { logout } from "./services/auth";
import { AppHeader, createHeaderMenu } from "./components/Header";
import { NotificationOverlay } from "./components/Notifications";
import { notificationService } from "./services/notifications";
import { friendService } from "./services/friends";
import { useNotifications, useUnreadNotifications, useUserPresence, useRequireAuth, useRequireVerified, useWelcomeNotice, useIsAdmin, useAdminPendingCounts } from "./hooks";
import { useAuthReady, useCurrentUser } from "./context";
import { AppRoutes } from "./routes";
import { CreatePostDialog } from "./components/Posts";
import { AppFooter } from "./components/Layout";
import { useLocation, useNavigate } from "react-router-dom"
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
  const { pathname } = useLocation();
  const isFullHeightView = pathname === "/chat" || pathname.startsWith("/chat/");
  const { t } = useTranslation();

  // Hooks
  const user = useCurrentUser();
  const authReady = useAuthReady();
  const requireAuth = useRequireAuth(user);
  const requireVerified = useRequireVerified(user);
  // "Guía de la app" del menú del avatar
  const openOnboarding = useOpenOnboarding();
  const { notifications, loading: loadingNotifications } = useNotifications(user, { limitCount: 10 });
  // Badge y punto rosa en "Chats" del rail: cuentan todas las no leídas, no solo las 10 del overlay
  const { unreadCount, hasUnreadMessages } = useUnreadNotifications(user);
  useUserPresence(user);
  // Accesos de admin en el menú del avatar, con lo que hay por revisar
  const { isAdmin } = useIsAdmin(user);
  const adminPending = useAdminPendingCounts(isAdmin);
  // "Cuenta creada": el formulario de registro ya no está en pantalla
  useWelcomeNotice(user, () => {
    toast.current?.show({
      severity: "success",
      summary: t("auth:register.createdTitle"),
      detail: t("auth:register.createdDetail"),
      life: 4000
    });
  });
  // Avisos que llegan después de que su pantalla se desmontó (p. ej. si no
  // salió el correo de verificación al registrarse, o la cuenta eliminada).
  // Solo cuando ya se dibujó el Toast: antes de authReady la app devuelve null
  useEffect(() => {
    if (!authReady) return undefined;
    return subscribeToAppNotices(({ severity, summaryKey, detailKey, detailParams }) => {
      // Un instante después: en desarrollo, StrictMode vuelve a montar el
      // Toast justo tras el primer montaje y se llevaría el aviso
      setTimeout(() => {
        toast.current?.show({ severity, summary: t(summaryKey), detail: t(detailKey, detailParams), life: 6000 });
      }, 0);
    });
  }, [t, authReady]);

  // UI Handlers
  const handleToggleNotifications = (e) => {
    if (!requireAuth()) return;
    notificationRef.current?.toggle(e);
  };
  const handleCloseCreatePost = () => { setShowCreatePost(false); setEditingPost(null); };
  const handleAcceptFriendRequest = (notification) => {
    // Aceptar crea la amistad: pide el correo verificado
    if (!requireVerified()) return Promise.resolve(false);
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
    // Con "volver a mostrarla", la guía sale otra vez en el próximo inicio de sesión
    clearOnboardingSession();
  };

  const items = createHeaderMenu(
    navigate,
    handleLogout,
    t,
    isAdmin ? adminPending : null,
    openOnboarding
  );

  return (
    <>
      <AppHeader
        unreadCount={unreadCount}
        hasUnreadMessages={hasUnreadMessages}
        items={items}
        adminPendingCount={isAdmin ? adminPending.reports + adminPending.guides : 0}
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
        {user && <EmailVerificationBanner />}
        <AppRoutes
          setEditingPost={setEditingPost}
          setShowCreatePost={setShowCreatePost}
        />
        {/* El chat ocupa toda la altura: ahí el pie estorbaría (los
            créditos siguen en el menú del avatar) */}
        {!isFullHeightView && <AppFooter />}
      </main>
      <Toast ref={toast} />
    </>
  );
}

export default App;
