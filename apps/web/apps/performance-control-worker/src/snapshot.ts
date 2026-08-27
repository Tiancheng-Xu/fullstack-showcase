export interface PerformanceRouteMetric {
	route: string;
	sampleCount: number;
	p50: number;
	p75: number;
	p95: number;
}

export interface PerformanceTrendMetric {
	bucketStart: number;
	sampleCount: number;
	p50: number;
	p75: number;
	p95: number;
}

export interface PerformanceMetric {
	name: string;
	unit: string;
	page: string;
	route: string;
	sampleCount: number;
	p50: number;
	p75: number;
	p95: number;
	errorCount: number;
	category?: "web-vital" | "metric" | "resource" | "error" | "custom" | "web3";
	routes?: PerformanceRouteMetric[];
	trend?: PerformanceTrendMetric[];
}

interface PerformanceSnapshotBase {
	projectSlug: string;
	captureId: string;
	capturedAt: string;
	kind: "synthetic-closed-loop" | "production-window";
	repository: string;
	commitSha: string;
	workflowRunId: string;
	sdkVersion: string;
	cleanerVersion: string;
	percentileMethod: string;
	sampleRate: number;
	filters: Record<string, string>;
	metrics: PerformanceMetric[];
}

export interface PerformanceSnapshotV1 extends PerformanceSnapshotBase {
	schemaVersion: 1;
	window: { from: string; to: string };
}

export interface PerformanceSnapshotV2 extends PerformanceSnapshotBase {
	schemaVersion: 2;
	window: { preset: "1h" | "24h" | "7d"; from: string; to: string };
	summary: {
		totalEvents: number;
		errorCount: number;
		errorRate: number;
		metricCount: number;
		routeCount: number;
		latestEventAt: number | null;
	};
	operation: {
		estimatedIncrementalCostUsd: number;
		maximumIncrementalCostUsd: number;
		ttlMinutes: number;
		observedRuntimeMinutes: number;
	};
}

export type PerformanceSnapshot = PerformanceSnapshotV1 | PerformanceSnapshotV2;

const safeSegment = /^[a-z0-9][a-z0-9._-]{0,127}$/i;
const commitSha = /^[a-f0-9]{40}$/;
const forbiddenKey = /(authorization|cookie|password|secret|token|private.?key)/i;
const isTimestamp = (value: string) => Number.isFinite(Date.parse(value));
const finiteNonNegative = (value: number) => Number.isFinite(value) && value >= 0;

const containsForbiddenKey = (value: unknown): boolean => {
	if (!value || typeof value !== "object") return false;
	return Object.entries(value).some(
		([key, nested]) => forbiddenKey.test(key) || containsForbiddenKey(nested),
	);
};

const validPercentiles = (value: {
	sampleCount: number;
	p50: number;
	p75: number;
	p95: number;
}) =>
	Number.isInteger(value.sampleCount) &&
	value.sampleCount > 0 &&
	[value.p50, value.p75, value.p95].every(finiteNonNegative) &&
	value.p50 <= value.p75 &&
	value.p75 <= value.p95;

export const immutableSnapshotKey = (snapshot: PerformanceSnapshot) =>
	`performance/${snapshot.projectSlug}/captures/${snapshot.captureId}.json`;

export const latestPointerKey = (projectSlug: string) =>
	`performance/${projectSlug}/latest.json`;

export const assertSnapshotPublishable = (
	snapshot: PerformanceSnapshot,
	context: { immutableObjectExists: boolean },
) => {
	if (context.immutableObjectExists) throw new Error("immutable_snapshot_already_exists");
	if (
		(snapshot.schemaVersion !== 1 && snapshot.schemaVersion !== 2) ||
		!safeSegment.test(snapshot.projectSlug) ||
		!safeSegment.test(snapshot.captureId) ||
		!isTimestamp(snapshot.capturedAt) ||
		!isTimestamp(snapshot.window.from) ||
		!isTimestamp(snapshot.window.to) ||
		Date.parse(snapshot.window.from) > Date.parse(snapshot.window.to) ||
		!commitSha.test(snapshot.commitSha) ||
		!snapshot.repository ||
		!snapshot.workflowRunId ||
		!snapshot.sdkVersion ||
		!snapshot.cleanerVersion ||
		!snapshot.percentileMethod ||
		!Number.isFinite(snapshot.sampleRate) ||
		snapshot.sampleRate <= 0 ||
		snapshot.sampleRate > 1 ||
		snapshot.metrics.length === 0 ||
		containsForbiddenKey(snapshot)
	) throw new Error("invalid_snapshot_contract");

	for (const metric of snapshot.metrics) {
		if (
			!metric.name ||
			!metric.unit ||
			!metric.page ||
			!metric.route ||
			!validPercentiles(metric) ||
			!Number.isInteger(metric.errorCount) ||
			metric.errorCount < 0 ||
			metric.errorCount > metric.sampleCount
		) throw new Error("invalid_metric_sample");
		for (const route of metric.routes ?? []) {
			if (!route.route || !validPercentiles(route)) throw new Error("invalid_metric_route");
		}
		let previousBucket = -1;
		for (const point of metric.trend ?? []) {
			if (!validPercentiles(point) || point.bucketStart <= previousBucket) {
				throw new Error("invalid_metric_trend");
			}
			previousBucket = point.bucketStart;
		}
	}

	if (snapshot.schemaVersion === 2) {
		const { operation, summary } = snapshot;
		if (
			!Number.isInteger(summary.totalEvents) ||
			summary.totalEvents < 1 ||
			!Number.isInteger(summary.errorCount) ||
			summary.errorCount < 0 ||
			summary.errorCount > summary.totalEvents ||
			!finiteNonNegative(summary.errorRate) ||
			summary.errorRate > 1 ||
			summary.metricCount !== snapshot.metrics.length ||
			!Number.isInteger(summary.routeCount) ||
			summary.routeCount < 0 ||
			(summary.latestEventAt !== null && !finiteNonNegative(summary.latestEventAt)) ||
			!finiteNonNegative(operation.estimatedIncrementalCostUsd) ||
			!finiteNonNegative(operation.maximumIncrementalCostUsd) ||
			operation.estimatedIncrementalCostUsd > operation.maximumIncrementalCostUsd ||
			!Number.isInteger(operation.ttlMinutes) ||
			operation.ttlMinutes < 1 ||
			!finiteNonNegative(operation.observedRuntimeMinutes) ||
			operation.observedRuntimeMinutes > operation.ttlMinutes
		) throw new Error("invalid_snapshot_v2_contract");
	}
};
