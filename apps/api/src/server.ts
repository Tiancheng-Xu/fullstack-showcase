import "dotenv/config";
import path from "node:path";
import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createMacOSKeychainTokenProvider } from "./auth/keychain-token-provider";
import { createDatabase } from "./db/database";
import { applyMigrations } from "./db/migration-runner";
import { createProfileRepository } from "./db/profile-repository";
import { readServerEnv } from "./env";
import { createGitHubProfileClient } from "./github/github-client";

const environment = readServerEnv();
const database = createDatabase(environment.DB_FILE_NAME);
applyMigrations(database.db, path.resolve(import.meta.dirname, "../drizzle"));

const tokenProvider = createMacOSKeychainTokenProvider({
	service: environment.KEYCHAIN_SERVICE,
	account: environment.KEYCHAIN_ACCOUNT,
});
const app = createApp({
	github: createGitHubProfileClient({ tokenProvider }),
	profiles: createProfileRepository(database.db),
});
const server = serve({ fetch: app.fetch, port: environment.PORT }, (info) => {
	console.info(`Local API listening on http://localhost:${info.port}`);
});

function shutdown() {
	server.close(() => {
		database.close();
	});
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
