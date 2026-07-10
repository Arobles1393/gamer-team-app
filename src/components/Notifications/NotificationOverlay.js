import { OverlayPanel } from "primereact/overlaypanel";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";

export default function NotificationOverlay({ 
	notificationRef,
	notifications,
	onAccept,
	onReject,
	onMarkAsRead, 
}) {
	const navigate = useNavigate();

	const closeOverlay = () => notificationRef.current?.hide();
	const notificationsList = notifications ?? [];

	const navigateNotification = (notification) => {
    switch (notification.type) {
			case "comment":
				navigate(`/post/${notification.relatedId}`);
				break;

			case "message":
				navigate("/chat", {
					state: {
						chatId: notification.relatedId
					}
				});
				break;

			case "interested":
				navigate(`/post/${notification.relatedId}`);
				break;

			default:
				break;
    }
	}

	const handleNotificationClick = async (notification) => {
    if (notification.type === "friend_request") return;

    await onMarkAsRead(notification.id);

    closeOverlay();

    navigateNotification(notification);
	};

	const handleAccept = (e, notification) => {
    e.stopPropagation();
    onAccept(notification);
	};

	const handleReject = (e, notification) => {
		e.stopPropagation();
		onReject(notification);
	};

	return(
		<OverlayPanel
			ref= {notificationRef}
			className= "notification-overlay"
		>
			{notificationsList.length === 0 ? (
				<p>No tienes notificaciones</p>
			) : (
				<>
					<div
						className= "notification-list"
					>
						{notifications.map((n) => (
							<div
								key= {n.id}
								className= "notification-item"
								onClick={() => handleNotificationClick(n)}
							>
								<div className="notification-item-content">
									<div className="notification-content">
										<strong>{n.title}</strong>
										<p className="notification-text">
											{n.text}
										</p>
									</div>
									{n.type === "friend_request" &&
									n.status !== "accepted" &&
									n.status !== "rejected" && (
										<div className="notification-actions">
											<Button
												icon="pi pi-check"
												rounded
												text
												severity="success"
												onClick={(e) => handleAccept(e, n)}
											/>

											<Button
												icon="pi pi-times"
												rounded
												text
												severity="danger"
												onClick={(e) => handleReject(e, n)}
											/>
										</div>
									)}
									{n.status === "accepted" && (
										<span className="notification-status notification-status-success">
											✅ Aceptada
										</span>
									)}

									{n.status === "rejected" && (
										<span className="notification-status notification-status-danger">
											❌ Rechazada
										</span>
									)}
								</div>
							</div>
						))}
					</div>
					<div className="notification-footer">
						<Button
							label="Ver todas"
							text
							icon="pi pi-list"
							onClick={() => {
								closeOverlay();
								navigate("/notifications");
							}}
						/>
					</div>
				</>
			)}
		</OverlayPanel>
	);
}