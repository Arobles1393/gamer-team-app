import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";

const callable = httpsCallable(functions, "getJoinInfo");

// "Unirme en Steam": { available: false } o { available: true, gameName, joinUrl }.
// La autorización la hace la Cloud Function (ver functions/steamJoin)
const getJoinInfo = async (targetUid, postId = null) => {
  const result = await callable(postId ? { targetUid, postId } : { targetUid });
  return result.data;
};

export const steamJoinService = {
  getJoinInfo
};
