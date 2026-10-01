import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import ChatTabs from "./ChatTabs";
import ChatListItem from "./ChatListItem";
import GroupChatListItem from "./GroupChatListItem";
import ChatListItemSkeleton from "./ChatListItemSkeleton";
import ChatEmptyState from "./ChatEmptyState";
import { useChats, useMyGroupChats, usePostSummaries, useUnreadNotifications, useUserProfiles } from "../../hooks";
import { useCurrentUser } from "../../context";

const getOtherUserId = (chat, currentUserId) =>
  chat.participants.find((id) => id !== currentUserId);

function ListSkeleton() {
  return (
    <ul className="chat-list__items" aria-busy="true" aria-label="Cargando chats">
      {Array.from({ length: 5 }, (_, i) => <ChatListItemSkeleton key={i} />)}
    </ul>
  );
}

// Lista de chats en dos pestañas: "Chats" (1:1) y "Chats de partida"
// (grupos de cada publicación). Cada pestaña usa su propio hook.
// activeChat / onSelectChat: { type: "direct" | "group", id }
export default function ChatList({ activeChat, onSelectChat }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  // Abre en la pestaña del chat que llegó seleccionado (p. ej. desde un post)
  const [tab, setTab] = useState(activeChat?.type === "group" ? "group" : "direct");

  // Si desde fuera se abre un chat del otro tipo, se cambia a su pestaña
  useEffect(() => {
    if (activeChat?.type) setTab(activeChat.type);
  }, [activeChat?.type, activeChat?.id]);

  const { chats, loading: loadingChats, error, retry } = useChats(user);
  const { groupChats, loading: loadingGroups, error: groupError } = useMyGroupChats(user);
  const { unreadChatIds, unreadGroupIds } = useUnreadNotifications(user);

  const otherUserIds = useMemo(
    () => chats.map((chat) => getOtherUserId(chat, user.uid)),
    [chats, user.uid]
  );
  const { profiles, loading: loadingProfiles } = useUserProfiles(otherUserIds);

  // Juego de cada grupo (título de la fila y búsqueda)
  const groupPosts = usePostSummaries(groupChats.map((group) => group.id));

  const term = search.trim().toLowerCase();

  // Búsqueda local: por nombre del otro participante o por juego
  const visibleChats = useMemo(() => {
    if (!term) return chats;
    return chats.filter((chat) =>
      profiles[getOtherUserId(chat, user.uid)]?.username?.toLowerCase().includes(term)
    );
  }, [chats, profiles, term, user.uid]);

  const visibleGroups = useMemo(() => {
    if (!term) return groupChats;
    return groupChats.filter((group) =>
      groupPosts[group.id]?.game?.toLowerCase().includes(term)
    );
  }, [groupChats, groupPosts, term]);

  // No leídos por pestaña (conversaciones, no mensajes); sin contar la abierta
  const unread = {
    direct: chats.filter((chat) =>
      unreadChatIds.has(chat.id) && !(activeChat?.type === "direct" && activeChat.id === chat.id)
    ).length,
    group: groupChats.filter((group) =>
      unreadGroupIds.has(group.id) && !(activeChat?.type === "group" && activeChat.id === group.id)
    ).length
  };

  const isActive = (type, id) => activeChat?.type === type && activeChat?.id === id;

  const renderDirect = () => {
    if (error) return <ChatEmptyState variant="error" onAction={retry} />;
    if (loadingChats || loadingProfiles) return <ListSkeleton />;
    if (chats.length === 0) {
      return <ChatEmptyState variant="noChats" onAction={() => navigate("/friends")} />;
    }
    if (visibleChats.length === 0) {
      return <ChatEmptyState variant="noMatch" detail={search} onAction={() => setSearch("")} />;
    }

    return (
      <ul className="chat-list__items">
        {visibleChats.map((chat) => {
          const active = isActive("direct", chat.id);

          return (
            <ChatListItem
              key={chat.id}
              chat={chat}
              otherUser={profiles[getOtherUserId(chat, user.uid)]}
              currentUserId={user.uid}
              active={active}
              unread={!active && unreadChatIds.has(chat.id)}
              onSelect={onSelectChat}
            />
          );
        })}
      </ul>
    );
  };

  const renderGroups = () => {
    if (groupError) return <ChatEmptyState variant="error" onAction={() => window.location.reload()} />;
    if (loadingGroups) return <ListSkeleton />;
    if (groupChats.length === 0) {
      return <ChatEmptyState variant="noGroupChats" onAction={() => navigate("/")} />;
    }
    if (visibleGroups.length === 0) {
      return <ChatEmptyState variant="noGroupMatch" detail={search} onAction={() => setSearch("")} />;
    }

    return (
      <ul className="chat-list__items">
        {visibleGroups.map((group) => {
          const active = isActive("group", group.id);

          return (
            <GroupChatListItem
              key={group.id}
              group={group}
              game={groupPosts[group.id]?.game}
              currentUserId={user.uid}
              active={active}
              unread={!active && unreadGroupIds.has(group.id)}
              onSelect={onSelectChat}
            />
          );
        })}
      </ul>
    );
  };

  const isGroupTab = tab === "group";
  const tabEmpty = isGroupTab ? groupChats.length === 0 : chats.length === 0;

  return (
    <section className="chat-list" aria-label="Lista de chats">
      <header className="chat-list__header">
        <span className="feed-header__eyebrow">GamerMatch</span>
        <h1 className="chat-list__title">Chats</h1>

        <ChatTabs tab={tab} onTabChange={setTab} unread={unread} />

        <IconField iconPosition="left" className="feed-search chat-list__search">
          <InputIcon className="pi pi-search" />
          <InputText
            type="search"
            className="feed-search__input"
            placeholder={isGroupTab ? "Buscar por juego…" : "Buscar chat…"}
            aria-label={isGroupTab ? "Buscar chat de partida por juego" : "Buscar chat por nombre de usuario"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={tabEmpty}
          />
        </IconField>
      </header>

      <div className="chat-list__body" role="tabpanel">
        {isGroupTab ? renderGroups() : renderDirect()}
      </div>
    </section>
  );
}
