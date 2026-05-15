import type { AppSnapshot } from "../../shared/types";

export const dockerContainerRef = (app: AppSnapshot) => {
	const rawDockerId = app.raw?.dockerId;
	if (typeof rawDockerId === "string" && rawDockerId.trim()) {
		return rawDockerId.trim();
	}

	return app.id.replace(/^docker:/, "");
};

export const pm2ProcessRef = (app: AppSnapshot) => {
	const rawPmId = app.raw?.pmId;
	if (typeof rawPmId === "number" && Number.isInteger(rawPmId)) {
		return String(rawPmId);
	}

	if (typeof rawPmId === "string" && rawPmId.trim()) {
		return rawPmId.trim();
	}

	return app.id.replace(/^pm2:/, "");
};
