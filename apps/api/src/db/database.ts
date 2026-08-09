import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/node-sqlite";

export function createDatabase(databasePath: string) {
	if (databasePath !== ":memory:") {
		mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });
	}

	const sqlite = new DatabaseSync(databasePath);
	sqlite.exec("pragma foreign_keys = on");
	const db = drizzle({ client: sqlite });

	return {
		db,
		sqlite,
		close: () => sqlite.close(),
	};
}

export type AppDatabase = ReturnType<typeof createDatabase>["db"];
