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
}

export interface PerformanceSnapshot {
	schemaVersion: 1;
	projectSlug: string;
	captureId: string;
	capturedAt: string;
	kind: "synthetic-closed-loop" | "production-window";
	window: { from: string; to: string };
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

const safeSegment = /^[a-z0-9][a-z0-9._-]{0,127}$/i;
const commitSha = /^[a-f0-9]{40}$/;
const forbiddenKey = /(authorization|cookie|password|secret|token|private.?key)/i;

const isTimestamp = (value: string) => Number.isFinite(Date.parse(value));

const containsForbiddenKey = (value: unknown): boolean => {
	if (!value || typeof value !== "object") return false;
	return Object.entries(value).some(
		([key, nested]) => forbiddenKey.test(key) || containsForbiddenKey(nested),
	);
};

export const immutableSnapshotKey = (snapshot: PerformanceSnapshot) =>
	`performance/${snapshot.projectSlug}/captures/${snapshot.captureId}.json`;

export const latestPointerKey = (projectSlug: string) =>
	`performance/${projectSlug}/latest.json`;

export const assertSnapshotPublishable = (
	snapshot: PerformanceSnapshot,
	context: { immutableObjectExists: boolean },
) => {
	if (context.immutableObjectExists) {
		throw new Error("immutable_snapshot_already_exists");
	}
	if (
		snapshot.schemaVersion !== 1 ||
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
	) {
		throw new Error("invalid_snapshot_contract");
	}

	for (const metric of snapshot.metrics) {
		const validMetric =
			metric.name.length > 0 &&
			metric.unit.length > 0 &&
			metric.page.length > 0 &&
			metric.route.length > 0 &&
			Number.isInteger(metric.sampleCount) &&
			metric.sampleCount > 0 &&
			Number.isInteger(metric.errorCount) &&
			metric.errorCount >= 0 &&
			metric.errorCount <= metric.sampleCount &&
			[metric.p50, metric.p75, metric.p95].every(
				(value) => Number.isFinite(value) && value >= 0,
			) &&
			metric.p50 <= metric.p75 &&
			metric.p75 <= metric.p95;
		if (!validMetric) throw new Error("invalid_metric_sample");
	}
};
