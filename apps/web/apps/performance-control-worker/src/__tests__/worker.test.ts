import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { handleRequest, type WorkerEnv } from "../worker";

class Statement {
	constructor(private readonly row: unknown) {}
	bind() {
		return this;
	}
	async first<T>() {
		return this.row as T | null;
	}
}

const env = (options?: {
	row?: unknown;
	objects?: Record<string, string>;
}): WorkerEnv => ({
	CONTROL_ENABLED: "false",
	CONTROL_DB: {
		prepare: () => new Statement(options?.row ?? null),
	},
	SNAPSHOTS: {
		get: async (key) => {
			const value = options?.objects?.[key];
			return value === undefined ? null : { text: async () => value };
		},
	},
});

describe("performance control worker public reads", () => {
	it("rejects unknown projects instead of exposing an open proxy", async () => {
		const response = await handleRequest(
			new Request("https://control.example/api/performance/status?project=unknown"),
			env(),
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: "unknown_project" });
	});

	it("returns an explicit unavailable state without invented metrics", async () => {
		const response = await handleRequest(
			new Request(
				"https://control.example/api/performance/status?project=performance-observability-control",
			),
			env(),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			projectSlug: "performance-observability-control",
			controlState: "stopped",
			dataMode: "unavailable",
			snapshotAvailable: false,
			metrics: [],
		});
	});

	it("serves only a verified immutable latest snapshot and supports ETag", async () => {
		const snapshot = JSON.stringify({
			schemaVersion: 1,
			projectSlug: "performance-observability-control",
			captureId: "capture-20260814T100000Z",
			capturedAt: "2026-08-14T10:00:00.000Z",
			kind: "synthetic-closed-loop",
			window: {
				from: "2026-08-14T09:55:00.000Z",
				to: "2026-08-14T10:00:00.000Z",
			},
			repository: "Tiancheng-Xu/course-homework",
			commitSha: "0123456789abcdef0123456789abcdef01234567",
			workflowRunId: "run-101",
			sdkVersion: "0.1.0",
			cleanerVersion: "0.1.0",
			percentileMethod: "nearest-rank",
			sampleRate: 1,
			filters: { environment: "preview", route: "/performance" },
			metrics: [
				{
					name: "LCP",
					unit: "ms",
					page: "/performance",
					route: "/performance",
					sampleCount: 4,
					p50: 900,
					p75: 1100,
					p95: 1400,
					errorCount: 0,
				},
			],
		});
		const digest = createHash("sha256").update(snapshot).digest("hex");
		const captureKey =
			"performance/performance-observability-control/captures/capture-20260814T100000Z.json";
		const objects = {
			"performance/performance-observability-control/latest.json": JSON.stringify({
				key: captureKey,
				sha256: digest,
			}),
			[captureKey]: snapshot,
		};

		const response = await handleRequest(
			new Request(
				"https://control.example/api/performance/snapshot?project=performance-observability-control",
			),
			env({ objects }),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("etag")).toBe(`"${digest}"`);
		expect(await response.json()).toMatchObject({
			projectSlug: "performance-observability-control",
			captureId: "capture-20260814T100000Z",
		});

		const cached = await handleRequest(
			new Request(
				"https://control.example/api/performance/snapshot?project=performance-observability-control",
				{ headers: { "if-none-match": `"${digest}"` } },
			),
			env({ objects }),
		);
		expect(cached.status).toBe(304);
	});
});

describe("performance control worker writes", () => {
	it("fails closed while Access verification and fixed workflow dispatch are not deployed", async () => {
		const response = await handleRequest(
			new Request(
				"https://control.example/api/performance/control/start?project=performance-observability-control",
				{ method: "POST" },
			),
			env(),
		);

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({
			error: "control_not_deployed",
			retryable: false,
		});
	});
});
