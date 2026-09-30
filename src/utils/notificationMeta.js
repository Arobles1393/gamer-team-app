// Icono del badge y acción que se muestra después del nombre del remitente
const NOTIFICATION_META = {
  friend_request: { icon: "pi-user-plus", action: "quiere agregarte como amigo" },
  friend_accepted: { icon: "pi-users", action: "aceptó tu solicitud de amistad" },
  message: { icon: "pi-comment", action: "te envió un mensaje" },
  comment: { icon: "pi-comments", action: "comentó en tu publicación" },
  interested: { icon: "pi-flag", action: "está interesado en tu partida" }
};

const DEFAULT_META = { icon: "pi-bell", action: "te envió una notificación" };

export const getNotificationMeta = (type) => NOTIFICATION_META[type] ?? DEFAULT_META;
