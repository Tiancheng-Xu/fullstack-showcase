import type {
	DispatchReadiness,
	DispatchReadinessReason,
} from "./dispatch-readiness";

export type PublicDispatchReadiness =
	| DispatchReadiness
	| {
			state: "unknown" | "stale";
			reason:
				| "readiness_not_checked"
				| "readiness_expired"
				| "readiness_invalid";
			checkedAt: string | null;
			freshUntil: string | null;
	  };

export type DispatchReadinessRow = {
	state: DispatchReadiness["state"];
	reason: DispatchReadinessReason;
	checked_at: string;
	fresh_until: string;
	probe_generation: number;
};

const isValidTimestamp = (value: string) => Number.isFinite(Date.parse(value));
const MAX_FRESHNESS_MS = 15 * 60 * 1000;

const expectedReasons: Record<
	DispatchReadiness["state"],
	ReadonlySet<DispatchReadinessReason>
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

export const projectDispatchReadiness = (
	row: DispatchReadinessRow | null,
	now = new Date(),
): PublicDispatchReadiness => {
	if (!row) {
		return {
			state: "unknown",
			reason: "readiness_not_checked",
			checkedAt: null,
			freshUntil: null,
		};
	}

	const checkedAt = Date.parse(row.checked_at);
	const freshUntil = Date.parse(row.fresh_until);
	if (
		!isValidTimestamp(row.checked_at) ||
		!isValidTimestamp(row.fresh_until) ||
		!Number.isInteger(row.probe_generation) ||
		row.probe_generation < 1 ||
		checkedAt > now.getTime() ||
		freshUntil <= checkedAt ||
		freshUntil - checkedAt > MAX_FRESHNESS_MS ||
		!expectedReasons[row.state]?.has(row.reason)
	) {
		return {
			state: "unknown",
			reason: "readiness_invalid",
			checkedAt: null,
			freshUntil: null,
		};
	}

	if (freshUntil <= now.getTime()) {
		return {
			state: "stale",
			reason: "readiness_expired",
			checkedAt: row.checked_at,
			freshUntil: row.fresh_until,
		};
	}

	return {
		state: row.state,
		reason: row.reason,
		checkedAt: row.checked_at,
		freshUntil: row.fresh_until,
	};
};

export const claimDispatchReadinessProbe = `
INSERT INTO dispatch_readiness (
  project_slug,
  state,
  reason,
  checked_at,
  fresh_until,
  probe_generation,
  probe_token
) VALUES (?1, 'app_unavailable', 'github_app_unavailable', ?2, ?3, 1, ?4)
ON CONFLICT(project_slug) DO UPDATE SET
	probe_generation = dispatch_readiness.probe_generation + 1,
	probe_token = excluded.probe_token
RETURNING probe_generation
`;

export const completeDispatchReadinessProbe = `
UPDATE dispatch_readiness SET
  state = ?2,
  reason = ?3,
  checked_at = ?4,
  fresh_until = ?5
WHERE project_slug = ?1
  AND probe_token = ?6
  AND probe_generation = ?7
`;
