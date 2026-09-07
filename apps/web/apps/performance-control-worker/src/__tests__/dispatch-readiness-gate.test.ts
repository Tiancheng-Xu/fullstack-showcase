import { describe, expect, it } from "vitest";
import { evaluateDispatchReadiness } from "../dispatch-readiness-gate";

const timestamps = {
	checkedAt: "2026-09-04T12:00:00.000Z",
	freshUntil: "2026-09-04T12:05:00.000Z",
};

describe("evaluateDispatchReadiness", () => {
	it("allows only a fresh ready result", () => {
		expect(
			evaluateDispatchReadiness({
				state: "ready",
				reason: "fixed_workflow_active",
				...timestamps,
			}),
		).toEqual({ ok: true });
	});

	it.each([
		[
			"workflow_disabled",
			"fixed_workflow_not_active",
			"fixed_workflow_disabled",
		],
		["workflow_missing", "fixed_workflow_not_found", "fixed_workflow_missing"],
	] as const)("maps %s to a configuration conflict", (state, reason, error) => {
		expect(evaluateDispatchReadiness({ state, reason, ...timestamps })).toEqual(
			{
				ok: false,
				status: 409,
				error,
			},
		);
	});

	it.each([
		[
			"permission_denied",
			"github_app_permission_denied",
			"github_app_permission_denied",
		],
		["app_unavailable", "github_app_unavailable", "github_app_unavailable"],
	] as const)(
		"maps %s to a fail-closed external dependency error",
		(state, reason, error) => {
			expect(
				evaluateDispatchReadiness({ state, reason, ...timestamps }),
			).toEqual({
				ok: false,
				status: 503,
				error,
			});
		},
	);

	it.each(["unknown", "stale"] as const)(
		"fails closed for %s cached readiness",
		(state) => {
			expect(
				evaluateDispatchReadiness({
					state,
					reason:
						state === "unknown" ? "readiness_not_checked" : "readiness_expired",
					checkedAt: state === "unknown" ? null : timestamps.checkedAt,
					freshUntil: state === "unknown" ? null : timestamps.freshUntil,
				}),
			).toEqual({
				ok: false,
				status: 503,
				error: "dispatch_readiness_unavailable",
			});
		},
	);
});
