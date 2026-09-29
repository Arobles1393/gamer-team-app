import { useCallback, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { UserProfileDialog } from "../UserProfile";
import PlayersHeader from "./PlayersHeader";
import PlayerCard from "./PlayerCard";
import PlayerCardSkeleton from "./PlayerCardSkeleton";
import PlayersEmptyState from "./PlayersEmptyState";
import { useFriendStatus, useProfileChat, useFriendRequest, usePlayerSearch } from "../../hooks";
import { useCurrentUser } from "../../context";
import "../Posts/Feed.css";
import "./FindPlayers.css";

export default function FindPlayers() {
  const user = useCurrentUser();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const toast = useRef(null);

  const { players, loading, error, retry } = usePlayerSearch(search, user?.uid);

  const { friendStatus, setFriendStatus } = useFriendStatus(
    user,
    selectedUserId
  );

  const { handleChat } = useProfileChat(
    user,
    selectedUserId,
    () => setShowProfile(false),
    () => {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo abrir el chat. Intenta de nuevo.",
        life: 3000
      });
    }
  );

  const { handleFriendRequest } = useFriendRequest(
    user,
    selectedUserId,
    () => setFriendStatus("pending")
  );

  const openProfile = useCallback((playerId) => {
    setSelectedUserId(playerId);
    setShowProfile(true);
  }, []);

  const hasSearch = Boolean(search.trim());

  const renderResults = () => {
    if (!hasSearch) {
      return <PlayersEmptyState variant="idle" search={search} />;
    }

    if (loading) {
      return (
        <div className="players-grid" aria-busy="true" aria-label="Buscando jugadores">
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
          {players.length} {players.length === 1 ? "jugador encontrado" : "jugadores encontrados"}
        </p>
        <div className="players-grid">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
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
        onHide={() => {
          setShowProfile(false);
          setSelectedUserId(null);
        }}
        selectedUserId={selectedUserId}
        friendStatus={friendStatus}
        onSendFriendRequest={handleFriendRequest}
        onChat={handleChat}
      />
      <Toast ref={toast} />
    </div>
  );
}
