import { Routes, Route } from "react-router-dom";
import App from "../App";
import { AuthProvider } from "../context";
import { SteamReturn } from "../components/Auth";

// Rutas fuera de la app: no pasan por el login ni montan el layout
const RootRoutes = () => {

	return (
		<Routes>
			<Route
				path="/auth/steam/return"
				element={<SteamReturn />}
			/>
			<Route
				path="*"
				element={
					<AuthProvider>
						<App />
					</AuthProvider>
				}
			/>
		</Routes>
	);

};

export default RootRoutes;
