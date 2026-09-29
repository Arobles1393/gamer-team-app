import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import ChatListItem from "./ChatListItem";
import ChatListItemSkeleton from "./ChatListItemSkeleton";
import ChatEmptyState from "./ChatEmptyState";
import { useChats, useUnreadNotifications, useUserProfiles } from "../../hooks";
import { useCurrentUser } from "../../context";

const getOtherUserId = (chat, currentUserId) =>
  chat.participants.find((id) => id !== currentUserId);

export default function ChatList({ activeChatId, onSelectChat }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { chats, loading, error, retry } = useChats(user);
  const { unreadChatIds } = useUnreadNotifications(user);

  const otherUserIds = useMemo(
    () => chats.map((chat) => getOtherUserId(chat, user.uid)),
    [chats, user.uid]
  );

  const { profiles, loading: loadingProfiles } = useUserProfiles(otherUserIds);

  // Búsqueda local por nombre del otro participante
  const visibleChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;

    return chats.filter((chat) =>
      profiles[getOtherUserId(chat, user.uid)]?.username?.toLowerCase().includes(term)
    );
  }, [chats, profiles, search, user.uid]);

  const renderBody = () => {
    if (error) {
      return <ChatEmptyState variant="error" onAction={retry} />;
    }

    if (loading || loadingProfiles) {
      return (
        <ul className="chat-list__items" aria-busy="true" aria-label="Cargando chats">
          {Array.from({ length: 5 }, (_, i) => <ChatListItemSkeleton key={i} />)}
        </ul>
      );
    }

    if (chats.length === 0) {
      return <ChatEmptyState variant="noChats" onAction={() => navigate("/friends")} />;
    }

    if (visibleChats.length === 0) {
      return (
        <ChatEmptyState variant="noMatch" detail={search} onAction={() => setSearch("")} />
      );
    }

    return (
      <ul className="chat-list__items">
        {visibleChats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            otherUser={profiles[getOtherUserId(chat, user.uid)]}
            currentUserId={user.uid}
            active={chat.id === activeChatId}
            unread={chat.id !== activeChatId && unreadChatIds.has(chat.id)}
            onSelect={onSelectChat}
          />
        ))}
      </ul>
    );
  };

  return (
    <section className="chat-list" aria-label="Lista de chats">
      <header className="chat-list__header">
        <span className="feed-header__eyebrow">GamerMatch</span>
        <h1 className="chat-list__title">Chats</h1>

        <IconField iconPosition="left" className="feed-search chat-list__search">
          <InputIcon className="pi pi-search" />
          <InputText
            type="search"
            className="feed-search__input"
            placeholder="Buscar chat…"
            aria-label="Buscar chat por nombre de usuario"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={chats.length === 0}
          />
        </IconField>
      </header>

      <div className="chat-list__body">
        {renderBody()}
      </div>
    </section>
  );
}
