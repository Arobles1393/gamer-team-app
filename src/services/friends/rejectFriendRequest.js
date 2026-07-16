import { db } from "../../firebase/config";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export const rejectFriendRequest = async (notification) => {

	const q = query(collection(db, "friend_requests"),
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
				status: "rejected"
			}
		);

		await updateDoc(
			doc(db, "notifications", notification.id),
			{
				status: "rejected",
				read: true
			}
		);
	}
};