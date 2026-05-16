import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "../../pages/dashboard/ui/DashboardPage";
import { HttpChecksPage } from "../../pages/httpChecks/ui/HttpChecksPage";
import { MonitorLayoutPage } from "../../pages/monitor/ui/MonitorLayoutPage";
import { ServerDetailsPage } from "../../pages/serverDetails/ui/ServerDetailsPage";
import { SshTargetsPage } from "../../pages/sshTargets/ui/SshTargetsPage";
import { routes } from "../../shared/config/routes";

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path={routes.dashboard} element={<MonitorLayoutPage />}>
					<Route index element={<DashboardPage />} />
					<Route path="http-checks" element={<HttpChecksPage />} />
					<Route path="servers/:serverId" element={<ServerDetailsPage />} />
					<Route path="ssh-targets" element={<SshTargetsPage />} />
				</Route>
				<Route path="*" element={<Navigate to={routes.dashboard} replace />} />
			</Routes>
		</BrowserRouter>
	);
}
