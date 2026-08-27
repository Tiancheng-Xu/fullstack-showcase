import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");

describe("performance control deployment gates", () => {
	it("keeps deployed migrations immutable and adds a TOTP throttle migration", () => {
		const original = readFileSync(resolve(root, "migrations/0001_performance_control.sql"), "utf8");
		expect(original).not.toContain("cleanup_required");
		expect(original).not.toContain("control_nonces");
		const upgrade = readFileSync(resolve(root, "migrations/0002_mfa_control_security.sql"), "utf8");
		expect(upgrade).toContain("callback_deliveries");
		expect(upgrade).toContain("delivery_id TEXT PRIMARY KEY");
		expect(upgrade).toContain("'unknown'");
		expect(upgrade).not.toContain("backfill-required:");
		expect(upgrade).toContain("legacy_snapshot_sha256");
		expect(upgrade).toContain("snapshot_sha256");
		const totp = readFileSync(resolve(root, "migrations/0003_totp_auth.sql"), "utf8");
		expect(totp).toContain("totp_attempts");
		expect(totp).toContain("locked_until");
	});

	it("migrates a digest-only legacy snapshot as unavailable audit evidence", () => {
		const directory = mkdtempSync(join(tmpdir(), "performance-control-migration-"));
		const database = join(directory, "control.sqlite");
		const digest = "a".repeat(64);
		try {
			const original = readFileSync(resolve(root, "migrations/0001_performance_control.sql"), "utf8");
			const upgrade = readFileSync(resolve(root, "migrations/0002_mfa_control_security.sql"), "utf8");
			execFileSync("sqlite3", [database], { input: `${original}\nINSERT INTO project_state (project_slug, control_state, data_mode, generation, cleanup_verified, snapshot_sha256, updated_at) VALUES ('performance-observability-control', 'stopped', 'historical', 0, 1, '${digest}', '2026-08-26T00:00:00.000Z');\n${upgrade}` });
			const projection = execFileSync("sqlite3", [database, "SELECT control_state, data_mode, COALESCE(snapshot_key, ''), COALESCE(snapshot_sha256, ''), legacy_snapshot_sha256 FROM project_state WHERE project_slug='performance-observability-control';"], { encoding: "utf8" }).trim();
			expect(projection).toBe(`unknown|unavailable|||${digest}`);
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	it("enables controls only through an explicit production-complete command", () => {
		expect(() => execFileSync("node", [resolve(root, "scripts/generate-production-config.mjs"), "--enable-control"], { encoding: "utf8", env: { ...process.env } })).toThrow();
		const output = execFileSync("node", [resolve(root, "scripts/generate-production-config.mjs"), "--enable-control"], {
			encoding: "utf8",
			env: {
				...process.env,
				CONTROL_ORIGIN: "https://baby2b.online",
				TOTP_SECRET: "JBSWY3DPEHPK3PXP",
				GITHUB_APP_ID: "12345",
				GITHUB_APP_INSTALLATION_ID: "67890",
				D1_DATABASE_NAME: "course-performance-control",
				D1_DATABASE_ID: "11111111-1111-4111-8111-111111111111",
				R2_BUCKET_NAME: "course-performance-snapshots",
			},
		});
		expect((JSON.parse(output) as { vars: { CONTROL_ENABLED: string } }).vars.CONTROL_ENABLED).toBe("true");
		expect(output).not.toContain("JBSWY3DPEHPK3PXP");
	});

	it("generates a deterministic production config that remains disabled", () => {
		const output = execFileSync("node", [resolve(root, "scripts/generate-production-config.mjs"), "--ci"], { encoding: "utf8" });
		const config = JSON.parse(output) as {
			name: string;
			vars: Record<string, string>;
			d1_databases: Array<{ database_name: string }>;
			r2_buckets: Array<{ bucket_name: string }>;
		};
		expect(config.name).toBe("baby2b-performance-control");
		expect(config.vars.CONTROL_ENABLED).toBe("false");
		expect(config.d1_databases).toEqual([
			expect.objectContaining({ database_name: "baby2b-performance-control" }),
		]);
		expect(config.r2_buckets).toEqual([
			expect.objectContaining({ bucket_name: "baby2b-performance-snapshots-ci" }),
		]);
		expect(output).not.toContain("ACCESS_");
	});

	it("keeps the remote gate on the canonical Baby2B D1 name", () => {
		const workflow = readFileSync(
			resolve(root, "../../../../.github/workflows/verify-performance-control.yml"),
			"utf8",
		);
		expect(workflow).toContain(
			"d1 migrations apply baby2b-performance-control",
		);
		expect(workflow).not.toContain(
			"d1 migrations apply course-performance-control",
		);
	});
});
