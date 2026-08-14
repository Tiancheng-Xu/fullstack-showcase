import type {
	PerformanceProjectStatus,
	PerformanceSnapshot,
	PerformanceView,
} from "./performance-types";

type SnapshotValidation =
	| { ok: true; snapshot: PerformanceSnapshot }
	| { ok: false; errors: string[] };

const SHA_PATTERN = /^[a-f0-9]{40}$/i;
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/i;

export function validatePerformanceSnapshot(
	candidate: PerformanceSnapshot,
): SnapshotValidation {
	const errors: string[] = [];

	if (!candidate.captureId.trim()) errors.push("captureId is required");
	if (Number.isNaN(Date.parse(candidate.capturedAt))) {
		errors.push("capturedAt must be an ISO timestamp");
	}
	if (!SHA_PATTERN.test(candidate.source.commitSha)) {
		errors.push("source.commitSha must be a full Git commit SHA");
	}
	if (!candidate.source.workflowRunId.trim()) {
		errors.push("source.workflowRunId is required");
	}
	if (!DIGEST_PATTERN.test(candidate.digest)) {
		errors.push("digest must be a sha256 digest");
	}
	if (candidate.method.sampleRate <= 0 || candidate.method.sampleRate > 1) {
		errors.push("sampleRate must be within (0, 1]");
	}
	if (candidate.metrics.length === 0) errors.push("metrics cannot be empty");

	for (const metric of candidate.metrics) {
		if (!metric.name.trim() || !metric.page.trim() || !metric.route.trim()) {
			errors.push("every metric requires name, page and route");
		}
		if (metric.sampleCount < 1) errors.push("sampleCount must be positive");
		if (metric.errorCount < 0 || metric.errorCount > metric.sampleCount) {
			errors.push("errorCount must be within the sample count");
		}
		if (metric.p50 > metric.p75 || metric.p75 > metric.p95) {
			errors.push("percentiles must be monotonic");
		}
	}

	return errors.length > 0 ? { ok: false, errors } : { ok: true, snapshot: candidate };
}

export function resolvePerformanceView(
	status: Pick<
		PerformanceProjectStatus,
		"controlState" | "liveHealthy" | "latestSnapshot"
	>,
): PerformanceView {
	const validated = status.latestSnapshot
		? validatePerformanceSnapshot(status.latestSnapshot)
		: null;
	const snapshot = validated?.ok ? validated.snapshot : null;

	if (status.controlState === "running" && status.liveHealthy) {
		return {
			controlState: status.controlState,
			dataMode: "live",
			label: "实时观测",
			detail: snapshot
				? "观测链路在线；展示最近一次已校验的实时聚合结果。"
				: "观测链路在线，正在等待第一份通过校验的聚合结果。",
			snapshot,
		};
	}

	if (snapshot) {
		return {
			controlState: status.controlState,
			dataMode: "historical",
			label: "历史快照",
			detail: "AWS 观测链路当前未在线；展示最后一次通过摘要校验的不可变快照。",
			snapshot,
		};
	}

	return {
		controlState: status.controlState,
		dataMode: "unavailable",
		label: "暂无可信快照",
		detail: "观测服务已停止，且尚无通过校验的历史快照。",
		snapshot: null,
	};
}
