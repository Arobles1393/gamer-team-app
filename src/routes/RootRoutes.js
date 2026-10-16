import { Routes, Route, Outlet } from "react-router-dom";
import App from "../App";
import { AuthProvider, VerifyPromptProvider } from "../context";
import { VerifyEmailDialog } from "../components/EmailVerification";
import { OnboardingProvider } from "../components/Onboarding";
import { AgeGateProvider } from "../components/AgeGate";
import { LoginPage, PasswordReset, SteamReturn } from "../components/Auth";
import { ScrollToTop } from "../components/Routing";

// Rutas de primer nivel: el retorno de Steam no necesita sesión; /login y la
// app comparten el AuthProvider (sin rail en /login)
const RootRoutes = () => {

	return (
		<>
		{/* Al cambiar de página se empieza arriba (o donde estaba, con atrás) */}
		<ScrollToTop />
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
							{/* "Tengo 18 años o más" (Google, Steam y cuentas anteriores) */}
							<AgeGateProvider>
								{/* Guía de bienvenida (no se abre sola en /privacidad, /terminos ni /admin) */}
								<OnboardingProvider>
									<App />
								</OnboardingProvider>
							</AgeGateProvider>
						</VerifyPromptProvider>
					}
				/>
			</Route>
		</Routes>
		</>
	);

};

export default RootRoutes;
