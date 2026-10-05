import { Routes, Route, Outlet } from "react-router-dom";
import App from "../App";
import { AuthProvider } from "../context";
import { LoginPage, PasswordReset, SteamReturn } from "../components/Auth";

// Rutas de primer nivel: el retorno de Steam no necesita sesión; /login y la
// app comparten el AuthProvider (sin rail en /login)
const RootRoutes = () => {

	return (
		<Routes>
			<Route
				path="/auth/steam/return"
				element={<SteamReturn />}
			/>
			<Route
				element={
					<AuthProvider>
						<Outlet />
					</AuthProvider>
				}
			>
				<Route
					path="/login"
					element={<LoginPage />}
				/>
				{/* Pública, mismo diseño que /login */}
				<Route
					path="/recuperar"
					element={<PasswordReset />}
				/>
				<Route
					path="*"
					element={<App />}
				/>
			</Route>
		</Routes>
	);

};

export default RootRoutes;
