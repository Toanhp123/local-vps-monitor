import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { ConfigDocumentStore } from "./database/configDocumentStore";
import { DatabaseStore } from "./databaseStore";
import { PinnedItemsStore } from "./pinnedItemsStore";

test("persists pinned items in sqlite config documents", () => {
	const dir = mkdtempSync(path.join(tmpdir(), "pinned-items-store-"));
	const dbStore = new DatabaseStore({
		databasePath: path.join(dir, "monitor.db"),
	});

	try {
		const first = new PinnedItemsStore(
			new ConfigDocumentStore(dbStore.getDatabase()),
		);

		assert.deepEqual(first.get(), {
			appGroupIdsByServerId: {},
			serverIds: [],
		});

		first.replace({
			appGroupIdsByServerId: {
				"server-1": ["group-1", "group-1", ""],
			},
			serverIds: ["server-1", "server-1", ""],
		});

		const second = new PinnedItemsStore(
			new ConfigDocumentStore(dbStore.getDatabase()),
		);

		assert.deepEqual(second.get(), {
			appGroupIdsByServerId: {
				"server-1": ["group-1"],
			},
			serverIds: ["server-1"],
		});
	} finally {
		dbStore.close();
		rmSync(dir, { force: true, recursive: true });
	}
});
