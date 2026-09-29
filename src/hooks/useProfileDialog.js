import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

// Estado del UserProfileDialog. El perfil propio no se abre en el diálogo:
// se va directo a Mi perfil, donde además se puede editar.
export const useProfileDialog = (user) => {
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [visible, setVisible] = useState(false);

  const openProfile = useCallback((userId) => {
    if (userId === user?.uid) {
      navigate("/profile");
      return;
    }

    setSelectedUserId(userId);
    setVisible(true);
  }, [user?.uid, navigate]);

  // Se conserva selectedUserId para que el diálogo no desaparezca de golpe al cerrar
  const closeProfile = useCallback(() => {
    setVisible(false);
  }, []);

  return {
    selectedUserId,
    visible,
    openProfile,
    closeProfile
  };
};
