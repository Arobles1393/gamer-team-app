import { Navigate, useLocation } from "react-router-dom";
import { useCurrentUser } from "../context";
import { useIsAdmin } from "../hooks";
import { NotFound } from "../components/NotFound";

// Rutas de admin (custom claim `admin`). Sin sesión, al login; con sesión
// pero sin permiso, 404 para no revelar que la ruta existe. Las reglas de
// Firestore son las que protegen los datos de verdad.
const RequireAdmin = ({ children }) => {
	const user = useCurrentUser();
	const location = useLocation();
	const { isAdmin, loading } = useIsAdmin(user);

	if (!user) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (loading) {
		return null;
	}

	return isAdmin ? children : <NotFound />;
};

export default RequireAdmin;
