import type { PublicDispatchReadiness } from "./dispatch-readiness-cache";

export type DispatchReadinessGateResult =
	| { ok: true }
	| {
			ok: false;
			status: 409 | 503;
			error:
				| "fixed_workflow_disabled"
				| "fixed_workflow_missing"
				| "github_app_permission_denied"
				| "github_app_unavailable"
				| "dispatch_readiness_unavailable";
	  };

export const evaluateDispatchReadiness = (
	readiness: PublicDispatchReadiness,
): DispatchReadinessGateResult => {
	switch (readiness.state) {
		case "ready":
			return { ok: true };
		case "workflow_disabled":
			return { ok: false, status: 409, error: "fixed_workflow_disabled" };
		case "workflow_missing":
			return { ok: false, status: 409, error: "fixed_workflow_missing" };
		case "permission_denied":
			return { ok: false, status: 503, error: "github_app_permission_denied" };
		case "app_unavailable":
			return { ok: false, status: 503, error: "github_app_unavailable" };
		case "unknown":
		case "stale":
			return {
				ok: false,
				status: 503,
				error: "dispatch_readiness_unavailable",
			};
	}
};
