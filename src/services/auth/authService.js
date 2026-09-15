import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
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

const register = async (
  email,
  password
) => {
  return createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
};

export const authService = {
  login,
  register
};