import { db } from "../../firebase/config";
import { addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export const acceptFriendRequest = async (notification, user, userData) => {
	
	await addDoc(
		collection(db, "friends"),
		{
			users: [
				notification.senderId,
				notification.userId
			],
			createdAt: serverTimestamp()
		}
	);

	// actualizar solicitud

	const q = query(
		collection(db, "friend_requests"),
		where(
			"senderId",
			"==",
			notification.senderId
		),
		where(
			"receiverId",
			"==",
			notification.userId
		),
		where(
			"status",
			"==",
			"pending"
		)
	);

	const snapshot = await getDocs(q);

	if (!snapshot.empty) {

		await updateDoc(
			snapshot.docs[0].ref,
			{
				status: "accepted"
			}
		);

		await updateDoc(
			doc(db, "notifications", notification.id),
			{
				status: "accepted",
				read: true
			}
		);

		await addDoc(
			collection(db, "notifications"),
			{
				userId: notification.senderId,
				senderId: user.uid,
				senderName: userData.username,
				senderAvatar: userData.avatar || null,
				type: "friend_accepted",
				title: "Solicitud aceptada",
				text: `${userData.username} aceptó tu solicitud de amistad`,
				read: false,
				createdAt: serverTimestamp()
			}
		);
	}
};