// Chat que se está viendo en /chat, para que el sonido de notificación no
// suene por mensajes de la conversación que ya está en pantalla.
// { type: "direct" | "group", id } o null. Lo mantiene ChatPage.

let openChat = null;

export const setOpenChat = (chat) => {
  openChat = chat ? { type: chat.type, id: chat.id } : null;
};

export const getOpenChat = () => openChat;

// ¿La notificación es de un mensaje del chat abierto?
// message → relatedId = chatId (1:1); group_message → relatedId = postId
export const isNotificationForOpenChat = (notification) => {
  if (!openChat) return false;
  if (notification.type === "message") {
    return openChat.type === "direct" && openChat.id === notification.relatedId;
  }
  if (notification.type === "group_message") {
    return openChat.type === "group" && openChat.id === notification.relatedId;
  }
  return false;
};
