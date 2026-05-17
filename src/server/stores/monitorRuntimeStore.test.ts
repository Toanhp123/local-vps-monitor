import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { MonitorRuntimeSettings } from "../../shared/types";
import { MonitorRuntimeStore } from "./monitorRuntimeStore";

const defaults: MonitorRuntimeSettings = {
	autoScanIntervalMs: 60_000,
	defaultAppLogLines: 200,
	httpCheckConcurrency: 8,
	incidentHistoryLimit: 100,
	localDockerCommandTimeoutMs: 12_000,
	metricHistoryLimit: 60,
	offlineAfterMs: 60_000,
	realtimeBroadcastMs: 5_000,
	serverOverrides: {},
	sshCommandTimeoutMs: 12_000,
	sshScanConcurrency: 4,
};

const withTempSettingsFile = (settings: unknown, run: (filePath: string) => void) => {
	const tempDir = fs.mkdtempSync(
		path.join(os.tmpdir(), "monitor-runtime-store-"),
	);

	try {
		const filePath = path.join(tempDir, "runtime.json");
		fs.writeFileSync(filePath, JSON.stringify(settings), "utf8");
		run(filePath);
	} finally {
		fs.rmSync(tempDir, { force: true, recursive: true });
	}
};

test("resolves server runtime overrides over global defaults", () => {
	withTempSettingsFile(
		{
			...defaults,
			serverOverrides: {
				"local-docker": {
					autoScanIntervalMs: 45_000,
					defaultAppLogLines: 300,
					localDockerCommandTimeoutMs: 20_000,
					offlineAfterMs: 90_000,
				},
				"server-1": {
					autoScanIntervalMs: 30_000,
					defaultAppLogLines: 500,
					offlineAfterMs: 120_000,
					sshCommandTimeoutMs: 30_000,
				},
			},
		},
		(filePath) => {
			const store = new MonitorRuntimeStore(filePath, defaults);

			assert.deepEqual(store.getServerSettings("server-1"), {
				autoScanIntervalMs: 30_000,
				defaultAppLogLines: 500,
				localDockerCommandTimeoutMs: 12_000,
				offlineAfterMs: 120_000,
				sshCommandTimeoutMs: 30_000,
			});
			assert.deepEqual(store.getServerSettings("server-2"), {
				autoScanIntervalMs: 60_000,
				defaultAppLogLines: 200,
				localDockerCommandTimeoutMs: 12_000,
				offlineAfterMs: 60_000,
				sshCommandTimeoutMs: 12_000,
			});
			assert.deepEqual(store.getServerSettings("local-docker"), {
				autoScanIntervalMs: 45_000,
				defaultAppLogLines: 300,
				localDockerCommandTimeoutMs: 20_000,
				offlineAfterMs: 90_000,
				sshCommandTimeoutMs: 12_000,
			});
		},
	);
});

test("drops invalid server runtime override values when loading settings", () => {
	withTempSettingsFile(
		{
			...defaults,
			serverOverrides: {
				"server-1": {
					autoScanIntervalMs: 999_999_999,
					defaultAppLogLines: "many",
					offlineAfterMs: 1,
					sshCommandTimeoutMs: 999_999,
				},
				"server-2": null,
			},
		},
		(filePath) => {
			const store = new MonitorRuntimeStore(filePath, defaults);

			assert.deepEqual(store.get().serverOverrides, {
				"server-1": {
					autoScanIntervalMs: 3_600_000,
					offlineAfterMs: 5_000,
					sshCommandTimeoutMs: 120_000,
				},
			});
			assert.deepEqual(store.getServerSettings("server-1"), {
				autoScanIntervalMs: 3_600_000,
				defaultAppLogLines: 200,
				localDockerCommandTimeoutMs: 12_000,
				offlineAfterMs: 5_000,
				sshCommandTimeoutMs: 120_000,
			});
		},
	);
});
