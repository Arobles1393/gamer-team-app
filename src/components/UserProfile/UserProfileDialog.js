import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { memo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import UserProfile from "./UserProfile";
import UserProfileActions from "./UserProfileActions";
import { ReportDialog } from "../Reports";
import { useBlockStatus, useReportDialog, useUserProfile } from "../../hooks";
import { blockService } from "../../services/blocks";
import { friendService } from "../../services/friends";
import { confirmDestructive } from "../../utils";
import { useCurrentUser } from "../../context";
import "./UserProfile.css";

// Las confirmaciones del perfil van en su propio ConfirmDialog: Amigos y
// Buscar jugadores no montan uno, y así no chocan con el de cada página
const CONFIRM_GROUP = "user-profile";

const DIALOG_PROPS = {
  className: "gm-dialog gm-dialog--bare gm-profile-dialog",
  maskClassName: "gm-dialog-mask",
  // El hero trae su propio botón de cerrar
  showHeader: false,
  style: { width: "1000px" },
  breakpoints: {
    "1100px": "94vw",
    "767px": "100vw"
  },
  dismissableMask: true,
  draggable: false,
  blockScroll: true
};

// onFriendStatusChange: el padre (dueño de friendStatus) se entera de que la
// amistad terminó al dejar de ser amigos o al bloquear
const UserProfileDialog = ({
  visible,
  onHide,
  selectedUserId,
  friendStatus,
  onSendFriendRequest,
  onChat,
  onFriendStatusChange
}) => {
  const { t } = useTranslation("profile");
  const user = useCurrentUser();
  // Toast propio: el diálogo se abre desde varias páginas (amigos, buscar
  // jugadores, feed, admin) y no todas tienen uno
  const toast = useRef(null);

  const showError = useCallback((detail) => {
    toast.current?.show({ severity: "error", summary: t("common:status.error"), detail, life: 3000 });
  }, [t]);
  const { userData } = useUserProfile(selectedUserId);
  const { blocked, blockedByMe, blockId } = useBlockStatus(user, selectedUserId);
  const { reportTarget, openReport, closeReport } = useReportDialog(user);

  // El perfil propio nunca llega aquí: useProfileDialog manda a /profile
  if (!selectedUserId) {
    return null;
  }

  const username = userData?.username || t("actions.thisUser");

  const handleRemoveFriend = () => {
    confirmDestructive({
      group: CONFIRM_GROUP,
      header: t("actions.removeFriend"),
      message: t("dialog.removeFriendMessage", { username }),
      acceptLabel: t("actions.removeFriend"),
      icon: "pi pi-user-minus",
      onAccept: async () => {
        try {
          await friendService.removeFriend(user.uid, selectedUserId);
          onFriendStatusChange?.("none");
        } catch (error) {
          console.error("Error al eliminar amigo:", error);
          showError(t("dialog.removeFriendError"));
        }
      }
    });
  };

  const handleBlock = () => {
    confirmDestructive({
      group: CONFIRM_GROUP,
      header: t("actions.blockUser", { name: username }),
      message: t("dialog.blockMessage"),
      acceptLabel: t("dialog.block"),
      icon: "pi pi-ban",
      onAccept: async () => {
        try {
          await blockService.blockUser(user.uid, selectedUserId);
          onFriendStatusChange?.("none");
          // No tiene sentido seguir viendo el perfil de alguien bloqueado
          onHide();
        } catch (error) {
          console.error("Error al bloquear:", error);
          showError(t("dialog.blockError"));
        }
      }
    });
  };

  const handleUnblock = async () => {
    try {
      await blockService.unblockUser(blockId);
    } catch (error) {
      console.error("Error al desbloquear:", error);
      showError(t("blocked.unblockError"));
    }
  };

  return (
    <>
      <Dialog
        {...DIALOG_PROPS}
        visible={visible}
        onHide={onHide}
        aria-label={t("player.eyebrow")}
      >
        <UserProfile
          userId={selectedUserId}
          onClose={onHide}
          actions={
            <UserProfileActions
              username={userData?.username}
              friendStatus={friendStatus}
              blocked={blocked}
              blockedByMe={blockedByMe}
              onSendFriendRequest={onSendFriendRequest}
              onChat={onChat}
              onRemoveFriend={handleRemoveFriend}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              onReport={() => openReport("user", selectedUserId, t("dialog.reportLabel", { username }))}
            />
          }
        />
      </Dialog>

      <ReportDialog target={reportTarget} onHide={closeReport} />
      <ConfirmDialog group={CONFIRM_GROUP} />
      <Toast ref={toast} />
    </>
  );
};

export default memo(UserProfileDialog);
