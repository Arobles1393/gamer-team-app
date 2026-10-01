import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "primereact/toast";
import { UserProfileDialog } from "../UserProfile";
import PlayersHeader from "./PlayersHeader";
import PlayerCard from "./PlayerCard";
import PlayerCardSkeleton from "./PlayerCardSkeleton";
import PlayersEmptyState from "./PlayersEmptyState";
import { useBlockedIds, useFriendStatus, useProfileChat, useFriendRequest, usePlayerSearch, useProfileDialog, useSteamPresenceBatch, useTwitchPresenceBatch } from "../../hooks";
import { excludeBlockedAuthors } from "../../utils";
import { useCurrentUser } from "../../context";
import "../Posts/Feed.css";
import "./FindPlayers.css";

export default function FindPlayers() {
  const { t } = useTranslation("friends");
  const user = useCurrentUser();
  const [search, setSearch] = useState("");
  const toast = useRef(null);

  const { players: foundPlayers, loading, error, retry } = usePlayerSearch(search, user?.uid);

  // Usuarios bloqueados (en cualquier dirección) no aparecen en la búsqueda
  const { blockedIds } = useBlockedIds(user);
  const players = useMemo(
    () => excludeBlockedAuthors(foundPlayers, blockedIds, "id"),
    [foundPlayers, blockedIds]
  );
  // Una sola consulta a Steam para todos los resultados
  const steamGames = useSteamPresenceBatch(players);
  const twitchLive = useTwitchPresenceBatch(players);

  const {
    selectedUserId,
    visible: showProfile,
    openProfile,
    closeProfile
  } = useProfileDialog(user);

  const { friendStatus, setFriendStatus } = useFriendStatus(
    user,
    selectedUserId
  );

  const { handleChat } = useProfileChat(
    user,
    selectedUserId,
    closeProfile,
    () => {
      toast.current?.show({
        severity: "error",
        summary: t("common:status.error"),
        detail: t("players.chatError"),
        life: 3000
      });
    }
  );

  const { handleFriendRequest } = useFriendRequest(
    user,
    selectedUserId,
    setFriendStatus
  );

  const hasSearch = Boolean(search.trim());

  const renderResults = () => {
    if (!hasSearch) {
      return <PlayersEmptyState variant="idle" search={search} />;
    }

    if (loading) {
      return (
        <div className="players-grid" aria-busy="true" aria-label={t("players.searching")}>
          {Array.from({ length: 6 }, (_, i) => <PlayerCardSkeleton key={i} />)}
        </div>
      );
    }

    if (error) {
      return <PlayersEmptyState variant="error" search={search} onAction={retry} />;
    }

    if (players.length === 0) {
      return (
        <PlayersEmptyState variant="empty" search={search} onAction={() => setSearch("")} />
      );
    }

    return (
      <>
        <p className="players-count" role="status">
          {t("players.found", { count: players.length })}
        </p>
        <div className="players-grid">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              steamGame={steamGames[player.id]}
              twitchLive={twitchLive[player.id]}
              onShowProfile={openProfile}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="feed players">
      <PlayersHeader search={search} onSearchChange={setSearch} />

      {renderResults()}

      <UserProfileDialog
        visible={showProfile}
        onHide={closeProfile}
        selectedUserId={selectedUserId}
        friendStatus={friendStatus}
        onSendFriendRequest={handleFriendRequest}
        onChat={handleChat}
        onFriendStatusChange={setFriendStatus}
      />
      <Toast ref={toast} />
    </div>
  );
}
