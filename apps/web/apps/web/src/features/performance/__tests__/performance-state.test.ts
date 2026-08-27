import { describe, expect, it } from "vitest";

import {
	resolvePerformanceView,
	validatePerformanceSnapshot,
} from "../performance-state";
import type { PerformanceSnapshot } from "../performance-types";

const snapshot: PerformanceSnapshot = {
	captureId: "capture-20260814-001",
	capturedAt: "2026-08-14T12:00:00.000Z",
	window: "closed-loop-smoke",
	kind: "synthetic-closed-loop",
	source: {
		repository: "Tiancheng-Xu/showcase-dashboard",
		commitSha: "0123456789abcdef0123456789abcdef01234567",
		workflowRunId: "31758788485",
		sdkVersion: "0.1.0",
		cleanerVersion: "0.1.0",
	},
	method: {
		percentile: "nearest-rank",
		sampleRate: 1,
	},
	metrics: [
		{
			name: "LCP",
			unit: "ms",
			page: "/dashboard",
			route: "/dashboard",
			sampleCount: 1,
			p50: 920,
			p75: 920,
			p95: 920,
			errorCount: 0,
		},
	],
	filters: { environment: "preview", projectId: "showcase-dashboard" },
	schemaVersion: "performance-snapshot/v1",
	digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
};

const snapshotV2: PerformanceSnapshot = {
	schemaVersion: 2,
	projectSlug: "performance-observability-control",
	captureId: "capture-20260827-001",
	capturedAt: "2026-08-27T00:30:00.000Z",
	kind: "synthetic-closed-loop",
	window: {
		preset: "1h",
		from: "2026-08-27T00:00:00.000Z",
		to: "2026-08-27T01:00:00.000Z",
	},
	repository: "Tiancheng-Xu/babysteps",
	commitSha: "0123456789abcdef0123456789abcdef01234567",
	workflowRunId: "33037553599",
	sdkVersion: "2.0.0",
	cleanerVersion: "2.0.0",
	percentileMethod: "nearest-rank",
	sampleRate: 1,
	filters: { environment: "production", window: "1h" },
	summary: {
		totalEvents: 4,
		errorCount: 1,
		errorRate: 0.25,
		metricCount: 1,
		routeCount: 1,
		latestEventAt: 1_787_773_600_000,
	},
	operation: {
		estimatedIncrementalCostUsd: 0.12,
		maximumIncrementalCostUsd: 0.2,
		ttlMinutes: 45,
		observedRuntimeMinutes: 15,
	},
	metrics: [
		{
			name: "LCP",
			category: "web-vital",
			unit: "ms",
			page: "all",
			route: "all",
			sampleCount: 3,
			p50: 900,
			p75: 1100,
			p95: 1400,
			errorCount: 0,
			routes: [{ route: "/", sampleCount: 3, p50: 900, p75: 1100, p95: 1400 }],
			trend: [{ bucketStart: 1_787_770_000_000, sampleCount: 3, p50: 900, p75: 1100, p95: 1400 }],
		},
	],
};

describe("validatePerformanceSnapshot", () => {
	it("accepts a complete immutable snapshot contract", () => {
		expect(validatePerformanceSnapshot(snapshot)).toEqual({
			ok: true,
			snapshot,
		});
	});

	it("accepts a complete multi-metric v2 snapshot contract", () => {
		expect(validatePerformanceSnapshot(snapshotV2)).toEqual({
			ok: true,
			snapshot: snapshotV2,
		});
	});

	it("rejects a snapshot whose source or metrics cannot be audited", () => {
		const invalid = {
			...snapshot,
			source: { ...snapshot.source, commitSha: "short" },
			metrics: [{ ...snapshot.metrics[0], sampleCount: 0 }],
		};

		expect(validatePerformanceSnapshot(invalid)).toMatchObject({ ok: false });
	});
});

describe("resolvePerformanceView", () => {
	it("keeps service state and data mode orthogonal while live", () => {
		expect(
			resolvePerformanceView({
				controlState: "running",
				liveHealthy: true,
				latestSnapshot: snapshot,
			}),
		).toMatchObject({
			controlState: "running",
			dataMode: "live",
			label: "实时观测",
		});
	});

	it("shows the last verified snapshot when AWS observation is stopped", () => {
		expect(
			resolvePerformanceView({
				controlState: "stopped",
				liveHealthy: false,
				latestSnapshot: snapshot,
			}),
		).toMatchObject({
			controlState: "stopped",
			dataMode: "historical",
			label: "历史快照",
			snapshot,
		});
	});

	it("never fabricates metrics when no verified snapshot exists", () => {
		const view = resolvePerformanceView({
			controlState: "stopped",
			liveHealthy: false,
			latestSnapshot: null,
		});

		expect(view.dataMode).toBe("unavailable");
		expect(view.snapshot).toBeNull();
		expect(view.label).toBe("暂无可信快照");
	});
});
