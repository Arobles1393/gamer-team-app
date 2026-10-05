import { Routes, Route, Outlet } from "react-router-dom";
import App from "../App";
import { AuthProvider, VerifyPromptProvider } from "../context";
import { VerifyEmailDialog } from "../components/EmailVerification";
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
				{/* Verificación de correo: diálogo y reenvío compartidos por toda la app */}
				<Route
					path="*"
					element={
						<VerifyPromptProvider dialog={<VerifyEmailDialog />}>
							<App />
						</VerifyPromptProvider>
					}
				/>
			</Route>
		</Routes>
	);

};

export default RootRoutes;
