import { createContext, useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAgeGate } from "../../hooks";
import { clearOnboardingSession } from "../../hooks/onboarding/useOnboarding";
import { useCurrentUser, useCurrentUserData } from "../../context";
import { logout } from "../../services/auth";
import { resetAppLanguage } from "../../i18n";
import { isAgeGateFreePath } from "../../routes/appPaths";
import AgeGateDialog from "./AgeGateDialog";

// true mientras haya sesión y la edad no esté confirmada (o todavía se esté
// leyendo): la guía de bienvenida espera, así no se abre debajo del diálogo
const AgeGatePendingContext = createContext(false);
export const useAgeGatePending = () => useContext(AgeGatePendingContext);

/**
 * Pide "Tengo 18 años o más" a quien tiene sesión y todavía no lo confirmó
 * (Google, Steam y cuentas anteriores a la casilla del registro). No se
 * muestra en las páginas legales ni en créditos, para poder leerlas.
 */
export default function AgeGateProvider({ children }) {
  const user = useCurrentUser();
  const userData = useCurrentUserData();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { status, pending, saving, confirm } = useAgeGate(user, userData);
  const blocking = Boolean(user) && status !== "confirmed";
  const [error, setError] = useState(false);

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
        visible={pending && !isAgeGateFreePath(pathname)}
        saving={saving}
        error={error}
        onConfirm={handleConfirm}
        onLogout={handleLogout}
      />
    </AgeGatePendingContext.Provider>
  );
}
