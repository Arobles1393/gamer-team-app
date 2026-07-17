import { OverlayPanel } from "primereact/overlaypanel";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { navigateNotification } from "../../utils";

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

	const handleNotificationClick = async (notification) => {
    if (notification.type === "friend_request") return;

    await onMarkAsRead(notification.id);

    closeOverlay();

    navigateNotification(notification, navigate);
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
						{notificationsList.map((notification) => {
							const status = notification.status;

							const isPendingFriendRequest =
								notification.type === "friend_request" &&
								status === "pending";

							const isAccepted = status === "accepted";

							const isRejected = status === "rejected";

							return(
								<div
									key= {notification.id}
									className= "notification-item"
									onClick={() => handleNotificationClick(notification)}
								>
									<div className="notification-item-content">
										<div className="notification-content">
											<strong>{notification.title}</strong>
											<p className="notification-text">
												{notification.text}
											</p>
										</div>
										{isPendingFriendRequest && (
											<div className="notification-actions">
												<Button
													icon="pi pi-check"
													rounded
													text
													severity="success"
													onClick={(e) => handleAccept(e, notification)}
												/>
												<Button
													icon="pi pi-times"
													rounded
													text
													severity="danger"
													onClick={(e) => handleReject(e, notification)}
												/>
											</div>
										)}
										{isAccepted && (
											<span className="notification-status notification-status-success">
												✅ Aceptada
											</span>
										)}
										{isRejected && (
											<span className="notification-status notification-status-danger">
												❌ Rechazada
											</span>
										)}
									</div>
								</div>
							);
						})}
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