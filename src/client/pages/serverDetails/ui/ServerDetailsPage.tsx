import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { routes } from "../../../shared/config/routes";
import { ServerDetailsView } from "../../../widgets/serverDetails/ui/ServerDetailsView";
import { useMonitorPageContext } from "../../monitor/model/useMonitorPageContext";

export function ServerDetailsPage() {
	const navigate = useNavigate();
	const { serverId } = useParams<{ serverId: string }>();
	const {
		activeScanId,
		handleScanServer,
		isAnyScanActive,
		now,
		overview,
	} = useMonitorPageContext();
	const selectedServer = serverId
		? overview?.servers.find((server) => server.serverId === serverId) || null
		: null;

	useEffect(() => {
		if (!serverId || !overview) return;

		if (!selectedServer) {
			navigate(routes.dashboard, { replace: true });
		}
	}, [navigate, overview, selectedServer, serverId]);

	if (!serverId) {
		return <Navigate to={routes.dashboard} replace />;
	}

	if (!selectedServer) {
		return (
			<div className="rounded-lg border border-slate-200 bg-white p-6">
				<span className="text-sm font-bold text-slate-500">
					Loading server details
				</span>
			</div>
		);
	}

	return (
		<ServerDetailsView
			isScanDisabled={isAnyScanActive}
			isScanning={activeScanId === selectedServer.serverId}
			now={now}
			onBack={() => {
				navigate(routes.dashboard);
				window.scrollTo({ top: 0 });
			}}
			onScan={() => handleScanServer(selectedServer.serverId)}
			server={selectedServer}
		/>
	);
}
