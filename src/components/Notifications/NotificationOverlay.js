import { OverlayPanel } from "primereact/overlaypanel";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import NotificationItem from "./NotificationItem";
import "./Notifications.css"

export default function NotificationOverlay({ 
	notificationRef,
	notifications,
	onAccept,
	onReject,
	onMarkAsRead, 
}) {
	const navigate = useNavigate();

	const notificationsList = notifications ?? [];

	const handleCloseOverlay = () => {
		notificationRef.current?.hide();
	};

	const handleViewAllNotifications = () => {
		handleCloseOverlay();
		navigate("/notifications");
	};

	return(
		<OverlayPanel ref= {notificationRef} className= "notification-overlay">
			{notificationsList.length === 0 ? (
				<p>No tienes notificaciones</p>
			) : (
				<>
					<div className= "notification-list">
						{notificationsList.map((notification) => (
							<NotificationItem
								key={notification.id}
								notification={notification}
								onAccept={onAccept}
								onReject={onReject}
								onMarkAsRead={onMarkAsRead}
								closeOverlay={handleCloseOverlay}
							/>
						))}
					</div>
					<div className="notification-footer">
						<Button
							label="Ver todas"
							text
							icon="pi pi-list"
							onClick={handleViewAllNotifications}
						/>
					</div>
				</>
			)}
		</OverlayPanel>
	);
}