import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

export const markNotificationAsRead = async (notificationId) => {
    const notificationRef = doc(db, "notifications", notificationId);

    await updateDoc(notificationRef, {
        read: true
    });
};