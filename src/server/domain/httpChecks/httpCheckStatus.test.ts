import assert from "node:assert/strict";
import test from "node:test";
import type { HttpCheck, HttpCheckResult, StoredServer } from "../../../shared/types";
import { createHttpCheckIncident } from "./httpCheckIncidents";
import { httpCheckResultStatus } from "./httpCheckStatus";

const check = {
	createdAt: "2026-05-15T00:00:00.000Z",
	enabled: true,
	expectedStatusMax: 299,
	expectedStatusMin: 200,
	id: "http-1",
	method: "GET",
	name: "Public API",
	serverId: "server-1",
	timeoutMs: 5000,
	updatedAt: "2026-05-15T00:00:00.000Z",
	url: "https://example.com/health",
} satisfies HttpCheck;

const server = {
	apps: [],
	collectorVersion: "test",
	host: {
		arch: "x64",
		cpuCount: 2,
		hostname: "test-host",
		loadAverage: [0, 0, 0],
		memoryFreeBytes: 512,
		memoryTotalBytes: 1024,
		platform: "linux",
		uptimeSeconds: 100,
	},
	incidents: [],
	lastSeenAt: "2026-05-15T00:00:00.000Z",
	observedAt: "2026-05-15T00:00:00.000Z",
	online: true,
	serverId: "server-1",
	serverName: "Production VPS",
	status: "healthy",
} satisfies StoredServer;

test("classifies HTTP check results from expected status range and failures", () => {
	assert.equal(httpCheckResultStatus({ check, statusCode: 204 }), "healthy");
	assert.equal(httpCheckResultStatus({ check, statusCode: 404 }), "warning");
	assert.equal(httpCheckResultStatus({ check, statusCode: 500 }), "down");
	assert.equal(
		httpCheckResultStatus({ check, error: "Timed out after 5000ms" }),
		"down",
	);
});

test("creates HTTP check incidents only when linked status changes", () => {
	const previousResult: HttpCheckResult = {
		checkedAt: "2026-05-15T00:00:00.000Z",
		status: "healthy",
		statusCode: 200,
	};
	const result: HttpCheckResult = {
		checkedAt: "2026-05-15T00:01:00.000Z",
		error: "Timed out after 5000ms",
		status: "down",
	};

	const incident = createHttpCheckIncident({
		check,
		previousResult,
		result,
		server,
	});

	assert.equal(incident?.kind, "http-check");
	assert.equal(incident?.severity, "critical");
	assert.equal(incident?.serverId, "server-1");
	assert.equal(
		createHttpCheckIncident({
			check,
			previousResult: result,
			result,
			server,
		}),
		null,
	);
});
