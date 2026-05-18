export interface HealthServiceOptions {
	databaseFile: string;
	version: string;
}

export class HealthService {
	constructor(private readonly options: HealthServiceOptions) {}

	getHealth() {
		return {
			ok: true,
			service: "vps-monitor-api",
			version: this.options.version,
			uptimeSeconds: Math.round(process.uptime()),
			timestamp: new Date().toISOString(),
			storage: {
				type: "sqlite",
				path: this.options.databaseFile,
			},
		};
	}
}
