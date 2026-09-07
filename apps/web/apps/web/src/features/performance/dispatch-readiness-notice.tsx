import "./dispatch-readiness-notice.css";

export type DispatchReadinessView = {
	state:
		| "ready"
		| "workflow_disabled"
		| "workflow_missing"
		| "app_unavailable"
		| "permission_denied"
		| "unknown"
		| "stale";
	reason: string;
	checkedAt: string | null;
	freshUntil: string | null;
};

const readinessCopy: Record<
	DispatchReadinessView["state"],
	{ label: string; detail: string; tone: "ready" | "blocked" | "unavailable" }
> = {
	ready: {
		label: "GitHub 控制入口已就绪",
		detail: "固定工作流已存在且处于启用状态，可以继续进行 TOTP 验证。",
		tone: "ready",
	},
	workflow_disabled: {
		label: "GitHub 控制工作流已暂停",
		detail: "启动入口保持禁用；恢复工作流前不会消耗 TOTP 验证次数。",
		tone: "blocked",
	},
	workflow_missing: {
		label: "固定控制工作流不存在",
		detail: "默认分支缺少注册表指定的工作流，禁止回退到任意 workflow。",
		tone: "blocked",
	},
	permission_denied: {
		label: "GitHub App 权限不足",
		detail: "控制面无法读取固定工作流；AWS Runtime 不会启动。",
		tone: "unavailable",
	},
	app_unavailable: {
		label: "GitHub App 当前不可用",
		detail: "安装令牌或 GitHub API 暂不可用，控制面已安全降级。",
		tone: "unavailable",
	},
	unknown: {
		label: "尚未验证调度入口",
		detail: "完成服务端只读检查前禁止启动。",
		tone: "unavailable",
	},
	stale: {
		label: "调度就绪状态已过期",
		detail: "需要重新检查固定工作流，旧状态不能用于启动。",
		tone: "unavailable",
	},
};

const fallbackReadiness: DispatchReadinessView = {
	state: "unknown",
	reason: "readiness_not_checked",
	checkedAt: null,
	freshUntil: null,
};

const readinessStates = new Set<DispatchReadinessView["state"]>([
	"ready",
	"workflow_disabled",
	"workflow_missing",
	"app_unavailable",
	"permission_denied",
	"unknown",
	"stale",
]);

const readinessReasons: Record<
	Exclude<DispatchReadinessView["state"], "unknown" | "stale">,
	ReadonlySet<string>
> = {
	ready: new Set(["fixed_workflow_active"]),
	workflow_disabled: new Set(["fixed_workflow_not_active"]),
	workflow_missing: new Set(["fixed_workflow_not_found"]),
	app_unavailable: new Set([
		"github_app_unavailable",
		"github_response_invalid",
	]),
	permission_denied: new Set(["github_app_permission_denied"]),
};

export const normalizeDispatchReadiness = (
	readiness: unknown,
	now = Date.now(),
): DispatchReadinessView => {
	if (!readiness || typeof readiness !== "object") return fallbackReadiness;
	const candidate = readiness as Record<string, unknown>;
	if (
		typeof candidate.state !== "string" ||
		!readinessStates.has(candidate.state as DispatchReadinessView["state"])
	) {
		return fallbackReadiness;
	}
	const state = candidate.state as DispatchReadinessView["state"];
	if (state === "unknown" || state === "stale") {
		return {
			state,
			reason:
				typeof candidate.reason === "string"
					? candidate.reason
					: "readiness_invalid",
			checkedAt:
				typeof candidate.checkedAt === "string" ? candidate.checkedAt : null,
			freshUntil:
				typeof candidate.freshUntil === "string" ? candidate.freshUntil : null,
		};
	}
	if (
		typeof candidate.reason !== "string" ||
		typeof candidate.checkedAt !== "string" ||
		typeof candidate.freshUntil !== "string"
	) {
		return fallbackReadiness;
	}
	const checkedAt = Date.parse(candidate.checkedAt);
	const freshUntil = Date.parse(candidate.freshUntil);
	if (
		!Number.isFinite(checkedAt) ||
		!Number.isFinite(freshUntil) ||
		checkedAt > now ||
		freshUntil <= checkedAt ||
		freshUntil - checkedAt > 15 * 60_000 ||
		!readinessReasons[state as keyof typeof readinessReasons]?.has(
			candidate.reason,
		)
	) {
		return fallbackReadiness;
	}
	if (freshUntil <= now) {
		return {
			state: "stale",
			reason: "readiness_expired",
			checkedAt: candidate.checkedAt,
			freshUntil: candidate.freshUntil,
		};
	}
	return {
		state,
		reason: candidate.reason,
		checkedAt: candidate.checkedAt,
		freshUntil: candidate.freshUntil,
	};
};

export const isDispatchReady = (readiness: unknown, now = Date.now()) =>
	normalizeDispatchReadiness(readiness, now).state === "ready";

export function DispatchReadinessNotice({
	readiness,
	now = Date.now(),
}: {
	readiness: unknown;
	now?: number;
}) {
	const normalized = normalizeDispatchReadiness(readiness, now);
	const copy = readinessCopy[normalized.state];

	return (
		<section
			aria-label="GitHub 调度就绪状态"
			className="performance-dispatch-readiness"
			data-readiness-state={normalized.state}
			data-readiness-tone={copy.tone}
		>
			<div>
				<p className="performance-dispatch-readiness__eyebrow">
					Dispatch readiness
				</p>
				<h3>{copy.label}</h3>
				<p>{copy.detail}</p>
			</div>
			<span
				aria-label={copy.tone === "ready" ? "调度可用" : "调度不可用"}
				role="status"
			>
				{copy.tone === "ready" ? "READY" : "BLOCKED"}
			</span>
		</section>
	);
}
