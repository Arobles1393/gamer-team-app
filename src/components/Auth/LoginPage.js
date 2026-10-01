import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthReady, useCurrentUser } from "../../context";
import Auth from "./Auth";

// Ruta /login. Al iniciar sesión (con cualquier método) regresa a la página
// desde la que se pidió el login; sin origen, al feed.
export default function LoginPage() {
  const user = useCurrentUser();
  const ready = useAuthReady();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/";

  if (!ready) return null;

  if (user) {
    return <Navigate to={from} replace />;
  }

  return <Auth onBack={() => navigate(from, { replace: true })} />;
}
