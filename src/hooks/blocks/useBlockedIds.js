import { useEffect, useMemo, useState } from "react";
import { blockService } from "../../services/blocks";

// Usuarios con los que hay bloqueo en cualquier dirección, en vivo, para
// ocultar su contenido. Sin sesión no hay bloqueos.
export const useBlockedIds = (user) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    return blockService.subscribeToBlocks(
      user.uid,
      (data) => {
        setBlocks(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo bloqueos:", error);
        setBlocks([]);
        setLoading(false);
      }
    );
  }, [user]);

  const blockedIds = useMemo(
    () => [...new Set(blocks.map((block) => block.otherId))],
    [blocks]
  );

  return { blockedIds, blocks, loading };
};
