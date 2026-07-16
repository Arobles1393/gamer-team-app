import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";

export const logout = async () => {

	await signOut(auth);

}