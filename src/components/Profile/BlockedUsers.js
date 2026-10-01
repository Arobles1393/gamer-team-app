import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { ProfileSection } from "../ProfileSection";
import { UserAvatar } from "../UserAvatar";
import { useBlockedIds, useUserProfiles } from "../../hooks";
import { blockService } from "../../services/blocks";
import { confirmDestructive, formatDates } from "../../utils";

const CONFIRM_GROUP = "blocked-users";

// Mi perfil: usuarios que bloqueé, para poder desbloquearlos. Es el único
// lugar donde aparecen: sus posts, comentarios y perfil quedan ocultos.
// Si alguien me bloqueó a mí no sale aquí (solo quien bloquea desbloquea).
// Sin bloqueos, la sección no se muestra.
export default function BlockedUsers({ user, onError }) {
  const { t } = useTranslation("profile");
  const { blocks } = useBlockedIds(user);
  const [unblockingId, setUnblockingId] = useState(null);

  const myBlocks = useMemo(
    () => blocks.filter((block) => block.blockedByMe),
    [blocks]
  );

  const { profiles } = useUserProfiles(myBlocks.map((block) => block.otherId));

  if (myBlocks.length === 0) {
    return null;
  }

  const handleUnblock = (block, username) => {
    confirmDestructive({
      group: CONFIRM_GROUP,
      header: t("blocked.unblockHeader", { username }),
      message: t("blocked.unblockMessage"),
      acceptLabel: t("blocked.unblock"),
      icon: "pi pi-lock-open",
      onAccept: async () => {
        setUnblockingId(block.id);

        try {
          await blockService.unblockUser(block.id);
        } catch (error) {
          console.error("Error al desbloquear:", error);
          onError?.(t("blocked.unblockError"));
        } finally {
          setUnblockingId(null);
        }
      }
    });
  };

  return (
    <ProfileSection title={t("blocked.title")} icon="pi-ban" className="blocked-users">
      <ul className="blocked-users__list">
        {myBlocks.map((block) => {
          const profile = profiles[block.otherId];
          const username = profile?.username || t("blocked.userFallback");
          const since = formatDates.formatDateN(block.createdAt);

          return (
            <li key={block.id} className="blocked-users__item">
              <UserAvatar
                image={profile?.avatar}
                username={username}
                className="blocked-users__avatar"
              />
              <span className="blocked-users__info">
                <span className="blocked-users__name">{username}</span>
                {since && (
                  <span className="blocked-users__date">
                    {t("blocked.since", { time: since.toLowerCase() })}
                  </span>
                )}
              </span>
              <Button
                label={t("blocked.unblock")}
                className="gm-btn gm-btn--ghost blocked-users__btn"
                loading={unblockingId === block.id}
                onClick={() => handleUnblock(block, username)}
              />
            </li>
          );
        })}
      </ul>

      <ConfirmDialog group={CONFIRM_GROUP} />
    </ProfileSection>
  );
}
