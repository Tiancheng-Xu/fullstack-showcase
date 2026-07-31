import "dotenv/config";
import path from "node:path";
import { readServerEnv } from "../env";
import { migrateDatabaseFile } from "./migration-runner";

const environment = readServerEnv();
migrateDatabaseFile(
	environment.DB_FILE_NAME,
	path.resolve(import.meta.dirname, "../../drizzle"),
);
