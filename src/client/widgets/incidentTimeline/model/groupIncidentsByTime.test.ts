import assert from "node:assert/strict";
import test from "node:test";
import type { IncidentEvent } from "@shared/types";
import { groupIncidentsByHour } from "./groupIncidentsByTime";

const incident = (id: string, occurredAt: string): IncidentEvent => ({
	id,
	kind: "app-health",
	message: `Incident ${id}`,
	occurredAt,
	serverId: "server-1",
	serverName: "Server 1",
	severity: "warning",
	title: `Incident ${id}`,
});

test("groups same clock hour on different dates separately", () => {
	const groups = groupIncidentsByHour([
		incident("old", "2026-05-15T22:15:00"),
		incident("new", "2026-05-18T22:05:00"),
	]);

	assert.deepEqual(
		groups.map((group) => group.label),
		["2026-05-18 22:00", "2026-05-15 22:00"],
	);
	assert.deepEqual(
		groups.map((group) => group.incidents.map((item) => item.id)),
		[["new"], ["old"]],
	);
});

test("sorts incidents inside an hour from newest to oldest", () => {
	const groups = groupIncidentsByHour([
		incident("earlier", "2026-05-18T22:05:00"),
		incident("later", "2026-05-18T22:30:00"),
	]);

	assert.deepEqual(
		groups[0]?.incidents.map((item) => item.id),
		["later", "earlier"],
	);
});
