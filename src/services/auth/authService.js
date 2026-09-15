import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/config";

const login = async (
  email,
  password
) => {
  return signInWithEmailAndPassword(
    auth,
    email,
    password
  );
};

export const authService = {
  login
};