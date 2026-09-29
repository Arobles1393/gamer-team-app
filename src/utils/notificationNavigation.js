const notificationRoutes = {
  comment: (notification, navigate) =>
    navigate(`/post/${notification.relatedId}`),

  interested: (notification, navigate) =>
    navigate(`/post/${notification.relatedId}`),

  friend_accepted: (_notification, navigate) =>
    navigate("/friends"),

  message: (notification, navigate) =>
    navigate("/chat", {
      state: {
        chatId: notification.relatedId
      }
    })
};

export const navigateNotification = (notification, navigate) => {
  notificationRoutes[notification.type]?.(notification, navigate);
};