export type PerformanceControlState =
	| "starting"
	| "running"
	| "stopping"
	| "stopped"
	| "failed"
	| "cleanup_required"
	| "degraded"
	| "unknown";

export type PerformanceDataMode = "live" | "historical" | "unavailable";

export type PerformanceMetric = {
	name: string;
	unit: "ms" | "count" | "ratio" | "bytes" | "score";
	page: string;
	route: string;
	sampleCount: number;
	p50: number;
	p75: number;
	p95: number;
	errorCount: number;
	category?: "web-vital" | "metric" | "resource" | "error" | "custom" | "web3";
	routes?: Array<{ route: string; sampleCount: number; p50: number; p75: number; p95: number }>;
	trend?: Array<{ bucketStart: number; sampleCount: number; p50: number; p75: number; p95: number }>;
};

type SnapshotSource = {
	repository: string;
	commitSha: string;
	workflowRunId: string;
	sdkVersion: string;
	cleanerVersion: string;
};

export type PerformanceSnapshotV1 = {
	captureId: string;
	capturedAt: string;
	window: string;
	kind: "synthetic-closed-loop" | "production-observation";
	source: SnapshotSource;
	method: { percentile: string; sampleRate: number };
	metrics: PerformanceMetric[];
	filters: Record<string, string>;
	schemaVersion: "performance-snapshot/v1";
	digest: `sha256:${string}`;
};

export type PerformanceSnapshotV2 = {
	schemaVersion: 2;
	projectSlug: string;
	captureId: string;
	capturedAt: string;
	kind: "synthetic-closed-loop" | "production-window";
	window: { preset: "1h" | "24h" | "7d"; from: string; to: string };
	repository: string;
	commitSha: string;
	workflowRunId: string;
	sdkVersion: string;
	cleanerVersion: string;
	percentileMethod: string;
	sampleRate: number;
	filters: Record<string, string>;
	summary: { totalEvents: number; errorCount: number; errorRate: number; metricCount: number; routeCount: number; latestEventAt: number | null };
	operation: { estimatedIncrementalCostUsd: number; maximumIncrementalCostUsd: number; ttlMinutes: number; observedRuntimeMinutes: number };
	metrics: PerformanceMetric[];
};

export type PerformanceSnapshot = PerformanceSnapshotV1 | PerformanceSnapshotV2;

export const performanceSnapshotSource = (snapshot: PerformanceSnapshot): SnapshotSource =>
	snapshot.schemaVersion === 2
		? { repository: snapshot.repository, commitSha: snapshot.commitSha, workflowRunId: snapshot.workflowRunId, sdkVersion: snapshot.sdkVersion, cleanerVersion: snapshot.cleanerVersion }
		: snapshot.source;

export type PerformanceView = {
	controlState: PerformanceControlState;
	dataMode: PerformanceDataMode;
	label: string;
	detail: string;
	snapshot: PerformanceSnapshot | null;
};

export type PerformanceProjectStatus = {
	projectId: string;
	projectName: string;
	controlState: PerformanceControlState;
	liveHealthy: boolean;
	latestSnapshot: PerformanceSnapshot | null;
};
