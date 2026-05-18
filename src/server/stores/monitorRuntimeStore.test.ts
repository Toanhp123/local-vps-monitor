import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { MonitorRuntimeSettings } from "../../shared/types";
import { ConfigDocumentStore } from "./database/configDocumentStore";
import { DatabaseStore } from "./databaseStore";
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

const withTempSettingsStore = (
	settings: unknown,
	run: (store: MonitorRuntimeStore) => void,
) => {
	const tempDir = fs.mkdtempSync(
		path.join(os.tmpdir(), "monitor-runtime-store-"),
	);
	const dbStore = new DatabaseStore({
		databasePath: path.join(tempDir, "monitor.db"),
	});

	try {
		const filePath = path.join(tempDir, "runtime.json");
		fs.writeFileSync(filePath, JSON.stringify(settings), "utf8");
		run(
			new MonitorRuntimeStore(
				new ConfigDocumentStore(dbStore.getDatabase()),
				filePath,
				defaults,
			),
		);
	} finally {
		dbStore.close();
		fs.rmSync(tempDir, { force: true, recursive: true });
	}
};

test("resolves server runtime overrides over global defaults", () => {
	withTempSettingsStore(
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
		(store) => {
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
	withTempSettingsStore(
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
		(store) => {
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

test("uses sqlite config document after migrating legacy runtime settings", () => {
	const tempDir = fs.mkdtempSync(
		path.join(os.tmpdir(), "monitor-runtime-store-"),
	);
	const dbStore = new DatabaseStore({
		databasePath: path.join(tempDir, "monitor.db"),
	});

	try {
		const filePath = path.join(tempDir, "runtime.json");
		fs.writeFileSync(
			filePath,
			JSON.stringify({
				...defaults,
				autoScanIntervalMs: 45_000,
			}),
			"utf8",
		);

		const first = new MonitorRuntimeStore(
			new ConfigDocumentStore(dbStore.getDatabase()),
			filePath,
			defaults,
		);

		first.replace({
			...first.get(),
			autoScanIntervalMs: 120_000,
		});

		fs.writeFileSync(
			filePath,
			JSON.stringify({
				...defaults,
				autoScanIntervalMs: 10_000,
			}),
			"utf8",
		);

		const second = new MonitorRuntimeStore(
			new ConfigDocumentStore(dbStore.getDatabase()),
			filePath,
			defaults,
		);

		assert.equal(second.get().autoScanIntervalMs, 120_000);
	} finally {
		dbStore.close();
		fs.rmSync(tempDir, { force: true, recursive: true });
	}
});
