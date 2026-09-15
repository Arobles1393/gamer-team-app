export const getNotificationText = (type, senderUsername) => {
  switch (type) {
    case "friend_request":
      return {
        title: "Solicitud de amistad",
        text: `${senderUsername} quiere agregarte`
      };
    case "friend_accepted":
      return {
        title: "Solicitud aceptada",
        text: `${senderUsername} aceptó tu solicitud de amistad`
      };
    case "message":
      return {
        title: "Nuevo mensaje",
        text: `${senderUsername} te envió un mensaje`
      };
    case "comment":
      return {
        title: "Nuevo comentario",
        text: `${senderUsername} comentó en tu publicación`
      };
    case "interested":
      return {
        title: "Nuevo interesado",
        text: `${senderUsername} está interesado en tu publicación`
      };
    default:
      return { title: "Notificación", text: "" };
  }
};