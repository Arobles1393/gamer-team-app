// Icono del badge y clave (notifications:actions.*) de la acción que se
// muestra después del nombre del remitente
const NOTIFICATION_META = {
  friend_request: { icon: "pi-user-plus", actionKey: "actions.friend_request" },
  friend_accepted: { icon: "pi-users", actionKey: "actions.friend_accepted" },
  message: { icon: "pi-comment", actionKey: "actions.message" },
  // NotificationItem usa actions.group_message_game si conoce el juego del post
  group_message: { icon: "pi-users", actionKey: "actions.group_message" },
  comment: { icon: "pi-comments", actionKey: "actions.comment" },
  interested: { icon: "pi-flag", actionKey: "actions.interested" }
};

const DEFAULT_META = { icon: "pi-bell", actionKey: "actions.default" };

export const getNotificationMeta = (type) => NOTIFICATION_META[type] ?? DEFAULT_META;

// Mensajes de chat (1:1 y de partida): los cuenta Chats, no la campana
const MESSAGE_TYPES = new Set(["message", "group_message"]);

export const isMessageNotification = (notification) => MESSAGE_TYPES.has(notification.type);
