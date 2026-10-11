import { useEffect, useState } from "react";
import { authService } from "../../services/auth";
import { userService } from "../../services/users";
import { profileService } from "../../services/profile";
import { postAppNotice } from "../../utils/appNotice";

// Si la cuenta sigue sin perfil este tiempo después de iniciar sesión, el
// registro falló a medias y se rehace (auditoría M-13). Con margen: al
// registrarse, la sesión se abre un momento antes de que se escriba el perfil
const MISSING_PROFILE_DELAY_MS = 10 * 1000;

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  // false hasta que Firebase confirma si hay sesión (evita redirigir al login al recargar)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsubscribeUserDoc = null;
    let missingTimer = null;

    const clearMissingTimer = () => {
      clearTimeout(missingTimer);
      missingTimer = null;
    };

    const unsubscribeAuth = authService.subscribeToAuthState(
      (currentUser) => {
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
          unsubscribeUserDoc = null;
        }
        clearMissingTimer();

        setUser(currentUser);
        setReady(true);

        if (!currentUser) {
          setUserData(null);
          return;
        }

        unsubscribeUserDoc =
          userService.subscribeToOwnProfile(
            currentUser.uid,
            (data) => {
              setUserData(data);

              if (data) {
                clearMissingTimer();
                return;
              }

              // Sin perfil: se espera por si se está creando y, si sigue
              // faltando, se crea uno básico (la suscripción lo recibe sola)
              if (!missingTimer) {
                missingTimer = setTimeout(async () => {
                  try {
                    const created = await profileService.ensureUserProfile(currentUser);
                    if (created) {
                      postAppNotice({
                        severity: "info",
                        summaryKey: "auth:profileRecovered.title",
                        detailKey: "auth:profileRecovered.detail"
                      });
                    }
                  } catch (error) {
                    console.error("No se pudo rehacer el perfil:", error.code || error.message);
                  }
                }, MISSING_PROFILE_DELAY_MS);
              }
            },
            (error) => {
              console.error(
                "Error al obtener el perfil del usuario:",
                error
              );

              setUserData(null);
            }
          );
      }
    );

    return () => {
      unsubscribeAuth();
      clearMissingTimer();

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  return {
    user,
    userData,
    ready
  };
};
