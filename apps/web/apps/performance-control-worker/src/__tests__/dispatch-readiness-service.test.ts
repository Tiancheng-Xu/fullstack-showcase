import { describe, expect, it, vi } from "vitest";
import {
	type DispatchReadinessDatabase,
	readDispatchReadiness,
	refreshDispatchReadiness,
} from "../dispatch-readiness-service";

const now = new Date("2026-09-04T12:00:00.000Z");

const target = {
	repository: "Tiancheng-Xu/babysteps",
	workflow: "aws-performance-control.yml",
	defaultBranch: "main",
};

type FakeDatabaseOptions = {
	row?: Record<string, unknown> | null;
	writeSuccess?: boolean;
	completeChanges?: number;
	claimGeneration?: number | null;
};

const fakeDatabase = ({
	row = null,
	writeSuccess = true,
	completeChanges = 1,
	claimGeneration = 1,
}: FakeDatabaseOptions = {}) => {
	const calls: Array<{ query: string; values: unknown[] }> = [];
	const database: DispatchReadinessDatabase = {
		prepare(query) {
			return {
				bind(...values) {
					calls.push({ query, values });
					return {
						first: async <T>() =>
							(query.includes("RETURNING probe_generation")
								? claimGeneration === null
									? null
									: { probe_generation: claimGeneration }
								: row) as T | null,
						run: async () => ({
							success: writeSuccess,
							meta: { changes: completeChanges },
						}),
					};
				},
			};
		},
	};
	return { database, calls };
};

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});

describe("dispatch readiness service", () => {
	it("reads a project-scoped fresh cache row", async () => {
		const { database, calls } = fakeDatabase({
			row: {
				state: "ready",
				reason: "fixed_workflow_active",
				checked_at: "2026-09-04T11:59:00.000Z",
				fresh_until: "2026-09-04T12:04:00.000Z",
				probe_generation: 2,
			},
		});

		await expect(
			readDispatchReadiness(database, "performance-observability-control", now),
		).resolves.toMatchObject({
			state: "ready",
		});
		expect(calls[0]?.values).toEqual(["performance-observability-control"]);
	});

	it("refreshes from GitHub and stores only the normalized readiness result", async () => {
		const { database, calls } = fakeDatabase();
		const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
			jsonResponse({
				path: ".github/workflows/aws-performance-control.yml",
				state: "disabled_manually",
			}),
		);

		await expect(
			refreshDispatchReadiness({
				database,
				projectSlug: "performance-observability-control",
				target,
				installationToken: async () => "short-lived-token",
				fetcher,
				now,
			}),
		).resolves.toMatchObject({ state: "workflow_disabled" });

		const write = calls.at(-1);
		expect(write?.values.slice(0, 5)).toEqual([
			"performance-observability-control",
			"workflow_disabled",
			"fixed_workflow_not_active",
			"2026-09-04T12:00:00.000Z",
			"2026-09-04T12:10:00.000Z",
		]);
		expect(write?.values[5]).toEqual(expect.any(String));
		expect(write?.values[6]).toBe(1);
		expect(JSON.stringify(calls)).not.toContain("short-lived-token");
	});

	it("records app_unavailable when token acquisition fails", async () => {
		const { database, calls } = fakeDatabase();

		await expect(
			refreshDispatchReadiness({
				database,
				projectSlug: "performance-observability-control",
				target,
				installationToken: async () => {
					throw new Error("app unavailable");
				},
				now,
			}),
		).resolves.toMatchObject({ state: "app_unavailable" });
		expect(calls.at(-1)?.values).toContain("github_app_unavailable");
	});

	it("fails closed if the D1 readiness write is not acknowledged", async () => {
		const { database } = fakeDatabase({ writeSuccess: false });
		const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
			jsonResponse({
				path: ".github/workflows/aws-performance-control.yml",
				state: "active",
			}),
		);

		await expect(
			refreshDispatchReadiness({
				database,
				projectSlug: "performance-observability-control",
				target,
				installationToken: async () => "short-lived-token",
				fetcher,
				now,
			}),
		).resolves.toEqual({
			state: "unknown",
			reason: "readiness_invalid",
			checkedAt: null,
			freshUntil: null,
		});
	});

	it("fails closed when a concurrent probe takes ownership before completion", async () => {
		const persistedCheckedAt = new Date(Date.now() - 60_000);
		const persistedFreshUntil = new Date(Date.now() + 4 * 60_000);
		const { database } = fakeDatabase({
			completeChanges: 0,
			claimGeneration: 3,
			row: {
				state: "ready",
				reason: "fixed_workflow_active",
				checked_at: persistedCheckedAt.toISOString(),
				fresh_until: persistedFreshUntil.toISOString(),
				probe_generation: 4,
			},
		});
		const olderNow = new Date(persistedCheckedAt.getTime() - 60_000);
		const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
			jsonResponse({
				path: ".github/workflows/aws-performance-control.yml",
				state: "active",
			}),
		);

		await expect(
			refreshDispatchReadiness({
				database,
				projectSlug: "performance-observability-control",
				target,
				installationToken: async () => "short-lived-token",
				fetcher,
				now: olderNow,
			}),
		).resolves.toEqual({
			state: "unknown",
			reason: "readiness_invalid",
			checkedAt: null,
			freshUntil: null,
		});
	});
});
