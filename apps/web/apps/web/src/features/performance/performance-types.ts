export type PerformanceControlState =
	| "starting"
	| "running"
	| "stopping"
	| "stopped"
	| "degraded"
	| "unknown";

export type PerformanceDataMode = "live" | "historical" | "unavailable";

export type PerformanceMetric = {
	name: string;
	unit: "ms" | "count" | "ratio" | "bytes";
	page: string;
	route: string;
	sampleCount: number;
	p50: number;
	p75: number;
	p95: number;
	errorCount: number;
};

export type PerformanceSnapshot = {
	captureId: string;
	capturedAt: string;
	window: string;
	kind: "synthetic-closed-loop" | "production-observation";
	source: {
		repository: string;
		commitSha: string;
		workflowRunId: string;
		sdkVersion: string;
		cleanerVersion: string;
	};
	method: {
		percentile: string;
		sampleRate: number;
	};
	metrics: PerformanceMetric[];
	filters: Record<string, string>;
	schemaVersion: "performance-snapshot/v1";
	digest: `sha256:${string}`;
};

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
