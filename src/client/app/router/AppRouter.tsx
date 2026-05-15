import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "../../pages/dashboard/ui/DashboardPage";
import { MonitorLayoutPage } from "../../pages/monitor/ui/MonitorLayoutPage";
import { ServerDetailsPage } from "../../pages/serverDetails/ui/ServerDetailsPage";
import { routes } from "../../shared/config/routes";

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path={routes.dashboard} element={<MonitorLayoutPage />}>
					<Route index element={<DashboardPage />} />
					<Route path="servers/:serverId" element={<ServerDetailsPage />} />
				</Route>
				<Route path="*" element={<Navigate to={routes.dashboard} replace />} />
			</Routes>
		</BrowserRouter>
	);
}
