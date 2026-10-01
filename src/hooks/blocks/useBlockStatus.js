import { useEffect, useState } from "react";
import { blockService } from "../../services/blocks";

const NO_BLOCK = { blockedByMe: false, blockedMe: false, blockId: null };

// Bloqueo con un usuario concreto, en vivo (perfil, chat).
// blocked: hay bloqueo en cualquier dirección. blockId solo si lo bloqueé yo
// (solo quien bloqueó puede desbloquear).
export const useBlockStatus = (user, otherUserId) => {
  const [status, setStatus] = useState(NO_BLOCK);
  const [loading, setLoading] = useState(Boolean(user && otherUserId));

  useEffect(() => {
    if (!user || !otherUserId) {
      setStatus(NO_BLOCK);
      setLoading(false);
      return;
    }

    setLoading(true);

    return blockService.subscribeToBlockStatus(
      user.uid,
      otherUserId,
      (data) => {
        setStatus(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo estado de bloqueo:", error);
        setStatus(NO_BLOCK);
        setLoading(false);
      }
    );
  }, [user, otherUserId]);

  return {
    ...status,
    blocked: status.blockedByMe || status.blockedMe,
    loading
  };
};
