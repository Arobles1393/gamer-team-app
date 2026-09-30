import { Navigate, useLocation } from "react-router-dom";
import { useCurrentUser } from "../context";

// Rutas privadas: sin sesión se va al login y, al entrar, se regresa aquí
const RequireAuth = ({ children }) => {
	const user = useCurrentUser();
	const location = useLocation();

	if (!user) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return children;
};

export default RequireAuth;
