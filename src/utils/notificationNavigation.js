const notificationRoutes = {
  comment: (notification, navigate) =>
    navigate(`/post/${notification.relatedId}`),

  interested: (notification, navigate) =>
    navigate(`/post/${notification.relatedId}`),

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