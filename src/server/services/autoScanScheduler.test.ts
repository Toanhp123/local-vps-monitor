import assert from "node:assert/strict";
import test from "node:test";
import { localDockerServerId } from "../domain/servers/serverIds";
import { AutoScanScheduler } from "./autoScanScheduler";

const runDueScans = (scheduler: AutoScanScheduler) => {
	return (
		scheduler as unknown as {
			scanDue: () => Promise<void>;
		}
	).scanDue();
};

const withMutedAutoScanLogs = async (run: () => Promise<void>) => {
	const originalLog = console.log;
	const originalWarn = console.warn;
	console.log = () => {};
	console.warn = () => {};

	try {
		await run();
	} finally {
		console.log = originalLog;
		console.warn = originalWarn;
	}
};

test("auto scan scheduler only scans servers with enabled intervals", async () => {
	const sshScanCalls: string[][] = [];
	let localScanCount = 0;
	let httpCheckCount = 0;
	const scheduler = new AutoScanScheduler(
		{
			listEnabledTargetIds: () => ["ssh-1", "ssh-2"],
			scanTargets: async (targetIds: string[]) => {
				sshScanCalls.push(targetIds);

				return {
					errors: [],
					results: targetIds.map((targetId) => ({
						appCount: 0,
						scannedAt: new Date().toISOString(),
						serverId: targetId,
						serverName: targetId,
						targetId,
					})),
				};
			},
		} as never,
		{
			scanLocalDocker: async () => {
				localScanCount += 1;

				return {
					appCount: 0,
					scannedAt: new Date().toISOString(),
					serverId: localDockerServerId,
					serverName: "Local Docker",
					targetId: localDockerServerId,
				};
			},
		} as never,
		{
			runAllChecks: async () => {
				httpCheckCount += 1;

				return { errors: [], results: [] };
			},
		} as never,
		(serverId) => (serverId === "ssh-1" ? 60_000 : 0),
		0,
	);

	await withMutedAutoScanLogs(async () => {
		await runDueScans(scheduler);
		await runDueScans(scheduler);
	});

	assert.deepEqual(sshScanCalls, [["ssh-1"]]);
	assert.equal(localScanCount, 0);
	assert.equal(httpCheckCount, 0);
});

test("auto scan scheduler runs local docker and http checks independently", async () => {
	const sshScanCalls: string[][] = [];
	let localScanCount = 0;
	let httpCheckCount = 0;
	const scheduler = new AutoScanScheduler(
		{
			listEnabledTargetIds: () => [],
			scanTargets: async (targetIds: string[]) => {
				sshScanCalls.push(targetIds);
				return { errors: [], results: [] };
			},
		} as never,
		{
			scanLocalDocker: async () => {
				localScanCount += 1;

				return {
					appCount: 0,
					scannedAt: new Date().toISOString(),
					serverId: localDockerServerId,
					serverName: "Local Docker",
					targetId: localDockerServerId,
				};
			},
		} as never,
		{
			runAllChecks: async () => {
				httpCheckCount += 1;

				return { errors: [], results: [] };
			},
		} as never,
		(serverId) => (serverId === localDockerServerId ? 60_000 : 0),
		60_000,
	);

	await withMutedAutoScanLogs(async () => {
		await runDueScans(scheduler);
		await runDueScans(scheduler);
	});

	assert.deepEqual(sshScanCalls, []);
	assert.equal(localScanCount, 1);
	assert.equal(httpCheckCount, 1);
});
