import { withGitHubTimeout } from "./github-http";

export type DispatchReadinessState =
	| "ready"
	| "workflow_disabled"
	| "workflow_missing"
	| "app_unavailable"
	| "permission_denied";

export type DispatchReadinessReason =
	| "fixed_workflow_active"
	| "fixed_workflow_not_active"
	| "fixed_workflow_not_found"
	| "github_app_unavailable"
	| "github_app_permission_denied"
	| "github_response_invalid";

export type DispatchReadiness = {
	state: DispatchReadinessState;
	reason: DispatchReadinessReason;
	checkedAt: string;
	freshUntil: string;
};

export type RegisteredWorkflowTarget = {
	repository: string;
	workflow: string;
	defaultBranch: string;
};

type ReadinessOptions = {
	fetcher?: typeof fetch;
	now?: Date;
	githubApiOrigin?: string;
	freshnessMs?: number;
	timeoutMs?: number;
};

export const DISPATCH_READINESS_FRESHNESS_MS = 10 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 5_000;

const readiness = (
	state: DispatchReadinessState,
	reason: DispatchReadinessReason,
	now: Date,
	freshnessMs: number,
): DispatchReadiness => ({
	state,
	reason,
	checkedAt: now.toISOString(),
	freshUntil: new Date(now.getTime() + freshnessMs).toISOString(),
});

const workflowFileName = (workflow: string) => {
	const fileName = workflow.split("/").at(-1);
	if (!fileName)
		throw new Error("registered workflow must include a file name");
	return fileName;
};

const githubHeaders = (installationToken: string) => ({
	accept: "application/vnd.github+json",
	authorization: `Bearer ${installationToken}`,
	"x-github-api-version": "2022-11-28",
});

const isPermissionFailure = (status: number) =>
	status === 401 || status === 403;

export const probeGitHubWorkflowReadiness = async (
	target: RegisteredWorkflowTarget,
	installationToken: string,
	options: ReadinessOptions = {},
): Promise<DispatchReadiness> => {
	const fetcher = options.fetcher ?? fetch;
	const now = options.now ?? new Date();
	const freshnessMs = options.freshnessMs ?? DISPATCH_READINESS_FRESHNESS_MS;
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const githubApiOrigin = options.githubApiOrigin ?? "https://api.github.com";

	if (!installationToken) {
		return readiness(
			"app_unavailable",
			"github_app_unavailable",
			now,
			freshnessMs,
		);
	}

	const repository = target.repository
		.split("/")
		.map((segment) => encodeURIComponent(segment))
		.join("/");
	const fixedWorkflowPath = target.workflow.startsWith(".github/workflows/")
		? target.workflow
		: `.github/workflows/${target.workflow}`;
	const headers = githubHeaders(installationToken);

	try {
		const { payload, response: workflowResponse } = await withGitHubTimeout(
			async (signal) => {
				const response = await fetcher(
					`${githubApiOrigin}/repos/${repository}/actions/workflows/${encodeURIComponent(workflowFileName(fixedWorkflowPath))}`,
					{ method: "GET", headers, signal },
				);
				return {
					response,
					payload: response.ok ? await response.json().catch(() => null) : null,
				};
			},
			timeoutMs,
		);

		if (workflowResponse.status === 404) {
			return readiness(
				"workflow_missing",
				"fixed_workflow_not_found",
				now,
				freshnessMs,
			);
		}
		if (isPermissionFailure(workflowResponse.status)) {
			return readiness(
				"permission_denied",
				"github_app_permission_denied",
				now,
				freshnessMs,
			);
		}
		if (!workflowResponse.ok) {
			return readiness(
				"app_unavailable",
				"github_app_unavailable",
				now,
				freshnessMs,
			);
		}

		if (
			!payload ||
			typeof payload !== "object" ||
			!("state" in payload) ||
			!("path" in payload) ||
			payload.path !== fixedWorkflowPath
		) {
			return readiness(
				"app_unavailable",
				"github_response_invalid",
				now,
				freshnessMs,
			);
		}

		if (payload.state !== "active") {
			return readiness(
				"workflow_disabled",
				"fixed_workflow_not_active",
				now,
				freshnessMs,
			);
		}

		return readiness("ready", "fixed_workflow_active", now, freshnessMs);
	} catch {
		return readiness(
			"app_unavailable",
			"github_app_unavailable",
			now,
			freshnessMs,
		);
	}
};
