import { describe, expect, it } from "vitest";

import {
	assertSnapshotPublishable,
	immutableSnapshotKey,
	latestPointerKey,
	type PerformanceSnapshot,
} from "../snapshot";

const snapshot: PerformanceSnapshot = {
	schemaVersion: 1,
	projectSlug: "showcase-dashboard",
	captureId: "capture-20260814T100000Z",
	capturedAt: "2026-08-14T10:00:00.000Z",
	kind: "synthetic-closed-loop" as const,
	window: { from: "2026-08-14T09:55:00.000Z", to: "2026-08-14T10:00:00.000Z" },
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
};

const snapshotV2 = {
	...snapshot,
	schemaVersion: 2 as const,
	window: {
		preset: "1h" as const,
		from: snapshot.window.from,
		to: snapshot.window.to,
	},
	summary: {
		totalEvents: 4,
		errorCount: 0,
		errorRate: 0,
		metricCount: 1,
		routeCount: 1,
		latestEventAt: Date.parse(snapshot.capturedAt),
	},
	operation: {
		estimatedIncrementalCostUsd: 0.12,
		maximumIncrementalCostUsd: 0.2,
		ttlMinutes: 45,
		observedRuntimeMinutes: 5,
	},
	metrics: snapshot.metrics.map((metric) => ({
		...metric,
		category: "web-vital" as const,
		routes: [
			{
				route: metric.route,
				sampleCount: metric.sampleCount,
				p50: metric.p50,
				p75: metric.p75,
				p95: metric.p95,
			},
		],
		trend: [
			{
				bucketStart: Date.parse(snapshot.window.from),
				sampleCount: metric.sampleCount,
				p50: metric.p50,
				p75: metric.p75,
				p95: metric.p95,
			},
		],
	})),
};

describe("immutable performance snapshots", () => {
	it("uses immutable capture keys and a separate latest pointer", () => {
		expect(immutableSnapshotKey(snapshot)).toBe(
			"performance/showcase-dashboard/captures/capture-20260814T100000Z.json",
		);
		expect(latestPointerKey(snapshot.projectSlug)).toBe(
			"performance/showcase-dashboard/latest.json",
		);
	});

	it("accepts a complete, internally ordered snapshot", () => {
		expect(() =>
			assertSnapshotPublishable(snapshot, { immutableObjectExists: false }),
		).not.toThrow();
	});

	it("accepts an auditable multi-metric v2 snapshot", () => {
		expect(() =>
			assertSnapshotPublishable(snapshotV2, { immutableObjectExists: false }),
		).not.toThrow();
	});

	it("rejects overwriting an immutable capture", () => {
		expect(() =>
			assertSnapshotPublishable(snapshot, { immutableObjectExists: true }),
		).toThrow("immutable_snapshot_already_exists");
	});

	it("rejects percentile inversions and placeholder data", () => {
		expect(() =>
			assertSnapshotPublishable(
				{
					...snapshot,
					metrics: [{ ...snapshot.metrics[0], sampleCount: 0, p95: 700 }],
				},
				{ immutableObjectExists: false },
			),
		).toThrow("invalid_metric_sample");
	});
});
