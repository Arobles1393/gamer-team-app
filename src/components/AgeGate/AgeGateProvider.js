import { createContext, useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAgeGate } from "../../hooks";
import { clearOnboardingSession } from "../../hooks/onboarding/useOnboarding";
import { useCurrentUser, useCurrentUserData } from "../../context";
import { logout } from "../../services/auth";
import { resetAppLanguage } from "../../i18n";
import { isAgeGateFreePath } from "../../routes/appPaths";
import AgeGateDialog from "./AgeGateDialog";
import UsernameDialog from "./UsernameDialog";

// true mientras haya sesión y falte un primer paso (o todavía se esté
// leyendo): la guía de bienvenida espera, así no se abre debajo
const AgeGatePendingContext = createContext(false);
export const useAgeGatePending = () => useContext(AgeGatePendingContext);

/**
 * Primeros pasos de la cuenta, en este orden:
 * 1. "Tengo 18 años o más" a quien todavía no lo confirmó (Google, Steam y
 *    cuentas anteriores a la casilla del registro).
 * 2. "Elige tu apodo" a quien empezó con uno genérico (Google y perfiles
 *    rehechos).
 * No se muestran en las páginas legales ni en créditos, para poder leerlas.
 */
export default function AgeGateProvider({ children }) {
  const user = useCurrentUser();
  const userData = useCurrentUserData();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { status, pending, chooseUsername, saving, confirm, finishUsername } = useAgeGate(user, userData);
  const blocking = Boolean(user) && (status !== "confirmed" || chooseUsername);
  const [error, setError] = useState(false);
  const freePath = isAgeGateFreePath(pathname);

  const handleConfirm = async () => {
    setError(false);
    if (!(await confirm())) setError(true);
  };

  // Igual que "Cerrar sesión" del menú (App.handleLogout)
  const handleLogout = () => {
    setError(false);
    navigate("/");
    logout();
    resetAppLanguage();
    clearOnboardingSession();
  };

  return (
    <AgeGatePendingContext.Provider value={blocking}>
      {children}
      <AgeGateDialog
        visible={pending && !freePath}
        saving={saving}
        error={error}
        onConfirm={handleConfirm}
        onLogout={handleLogout}
      />
      <UsernameDialog
        visible={status === "confirmed" && chooseUsername && !freePath}
        current={userData?.username}
        saving={saving}
        onFinish={finishUsername}
      />
    </AgeGatePendingContext.Provider>
  );
}
