import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { UserProfileDialog } from "../UserProfile";
import { PlayerCard, PlayerCardSkeleton } from "../FindPlayers";
import FriendsHeader from "./FriendsHeader";
import FriendsFilters from "./FriendsFilters";
import FriendsEmptyState from "./FriendsEmptyState";
import { useFriends, useUserProfiles, useFriendStatus, useProfileChat, useFriendRequest, useProfileDialog, useSteamPresenceBatch, useTwitchPresenceBatch } from "../../hooks";
import { isOnline } from "../../utils";
import { useCurrentUser } from "../../context";
import "../Posts/Feed.css";
import "../FindPlayers/FindPlayers.css";

// Primero los que están en línea, luego por nombre
const compareFriends = (a, b) =>
  isOnline(b.lastSeen) - isOnline(a.lastSeen) ||
  (a.username || "").localeCompare(b.username || "", "es", { sensitivity: "base" });

export default function Friends() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const toast = useRef(null);

  const { friendIds, loading: loadingIds, error, retry } = useFriends(user);
  const { users: friends, loading: loadingProfiles } = useUserProfiles(friendIds);
  // Una sola consulta a Steam para todos los amigos
  const steamGames = useSteamPresenceBatch(friends);
  // Una sola consulta a Twitch para todos los amigos
  const twitchLive = useTwitchPresenceBatch(friends);

  const {
    selectedUserId,
    visible: showProfile,
    openProfile,
    closeProfile
  } = useProfileDialog(user);

  const { friendStatus, setFriendStatus } = useFriendStatus(user, selectedUserId);

  const showChatError = useCallback((message) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: message,
      life: 3000
    });
  }, []);

  const { handleChat, openChatWith } = useProfileChat(
    user,
    selectedUserId,
    closeProfile,
    showChatError
  );

  const { handleFriendRequest } = useFriendRequest(
    user,
    selectedUserId,
    setFriendStatus
  );

  const sortedFriends = useMemo(() => [...friends].sort(compareFriends), [friends]);

  const counts = useMemo(() => ({
    all: friends.length,
    online: friends.filter((friend) => isOnline(friend.lastSeen)).length
  }), [friends]);

  // Búsqueda local por nombre de usuario + chip "En línea"
  const visibleFriends = useMemo(() => {
    const term = search.trim().toLowerCase();

    return sortedFriends.filter((friend) => {
      const matchSearch = !term || friend.username?.toLowerCase().includes(term);
      const matchFilter = filter === "all" || isOnline(friend.lastSeen);
      return matchSearch && matchFilter;
    });
  }, [sortedFriends, search, filter]);

  const loading = loadingIds || loadingProfiles;
  const hasFriends = friends.length > 0;

  const renderResults = () => {
    if (error) {
      return <FriendsEmptyState variant="error" search={search} onAction={retry} />;
    }

    if (loading) {
      return (
        <div className="players-grid" aria-busy="true" aria-label="Cargando amigos">
          {Array.from({ length: 6 }, (_, i) => <PlayerCardSkeleton key={i} />)}
        </div>
      );
    }

    if (!hasFriends) {
      return (
        <FriendsEmptyState
          variant="empty"
          search={search}
          onAction={() => navigate("/findPlayers")}
        />
      );
    }

    if (visibleFriends.length === 0) {
      return search.trim() ? (
        <FriendsEmptyState variant="noMatch" search={search} onAction={() => setSearch("")} />
      ) : (
        <FriendsEmptyState variant="offline" search={search} onAction={() => setFilter("all")} />
      );
    }

    return (
      <div className="players-grid">
        {visibleFriends.map((friend) => (
          <PlayerCard
            key={friend.id}
            player={friend}
            steamGame={steamGames[friend.id]}
            twitchLive={twitchLive[friend.id]}
            onShowProfile={openProfile}
            onChat={openChatWith}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="feed players friends">
      <FriendsHeader
        search={search}
        onSearchChange={setSearch}
        disabled={!hasFriends}
      />

      {hasFriends && !error && (
        <FriendsFilters
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />
      )}

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
