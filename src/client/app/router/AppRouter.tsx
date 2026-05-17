import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "@/pages/dashboard";
import { HttpChecksPage } from "@/pages/httpChecks";
import { MonitorLayoutPage } from "@/pages/monitor";
import { SettingsPage } from "@/pages/settings";
import { ServerDetailsPage } from "@/pages/serverDetails";
import { SshTargetsPage } from "@/pages/sshTargets";
import { routes } from "@/shared/config/routes";

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path={routes.dashboard} element={<MonitorLayoutPage />}>
					<Route index element={<DashboardPage />} />
					<Route path="http-checks" element={<HttpChecksPage />} />
					<Route path="settings" element={<SettingsPage />} />
					<Route path="servers/:serverId" element={<ServerDetailsPage />} />
					<Route path="ssh-targets" element={<SshTargetsPage />} />
				</Route>
				<Route path="*" element={<Navigate to={routes.dashboard} replace />} />
			</Routes>
		</BrowserRouter>
	);
}
