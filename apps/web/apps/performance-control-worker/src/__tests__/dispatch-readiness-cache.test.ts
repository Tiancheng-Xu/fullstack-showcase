import { describe, expect, it } from "vitest";
import {
	claimDispatchReadinessProbe,
	completeDispatchReadinessProbe,
	type DispatchReadinessRow,
	projectDispatchReadiness,
} from "../dispatch-readiness-cache";

const now = new Date("2026-09-04T12:00:00.000Z");

const row = (
	overrides: Partial<DispatchReadinessRow> = {},
): DispatchReadinessRow => ({
	state: "ready",
	reason: "fixed_workflow_active",
	checked_at: "2026-09-04T11:59:00.000Z",
	fresh_until: "2026-09-04T12:04:00.000Z",
	probe_generation: 3,
	...overrides,
});

describe("projectDispatchReadiness", () => {
	it("fails closed before the first probe", () => {
		expect(projectDispatchReadiness(null, now)).toEqual({
			state: "unknown",
			reason: "readiness_not_checked",
			checkedAt: null,
			freshUntil: null,
		});
	});

	it("returns a fresh terminal readiness result", () => {
		expect(projectDispatchReadiness(row(), now)).toEqual({
			state: "ready",
			reason: "fixed_workflow_active",
			checkedAt: "2026-09-04T11:59:00.000Z",
			freshUntil: "2026-09-04T12:04:00.000Z",
		});
	});

	it("preserves the precise malformed-response reason", () => {
		expect(
			projectDispatchReadiness(
				row({ state: "app_unavailable", reason: "github_response_invalid" }),
				now,
			),
		).toMatchObject({
			state: "app_unavailable",
			reason: "github_response_invalid",
		});
	});

	it("expires readiness at the boundary instead of extending it locally", () => {
		expect(
			projectDispatchReadiness(
				row({ fresh_until: "2026-09-04T12:00:00.000Z" }),
				now,
			),
		).toMatchObject({ state: "stale", reason: "readiness_expired" });
	});

	it("rejects malformed timestamps and generations", () => {
		expect(
			projectDispatchReadiness(row({ checked_at: "not-a-date" }), now),
		).toMatchObject({
			state: "unknown",
			reason: "readiness_invalid",
		});
		expect(
			projectDispatchReadiness(row({ probe_generation: 0 }), now),
		).toMatchObject({
			state: "unknown",
			reason: "readiness_invalid",
		});
		expect(
			projectDispatchReadiness(row({ probe_generation: 1.5 }), now),
		).toMatchObject({
			state: "unknown",
			reason: "readiness_invalid",
		});
	});

	it("rejects future checks, invalid windows, and mismatched state reasons", () => {
		for (const invalidRow of [
			row({ checked_at: "2026-09-04T12:00:01.000Z" }),
			row({ fresh_until: "2026-09-04T11:58:00.000Z" }),
			row({ fresh_until: "2026-09-04T12:20:00.000Z" }),
			row({ state: "ready", reason: "fixed_workflow_not_active" }),
		]) {
			expect(projectDispatchReadiness(invalidRow, now)).toMatchObject({
				state: "unknown",
				reason: "readiness_invalid",
			});
		}
	});
});

describe("dispatch readiness probe ownership", () => {
	it("claims a monotonic generation before probing and completes only its token", () => {
		expect(claimDispatchReadinessProbe).toContain("ON CONFLICT(project_slug)");
		expect(claimDispatchReadinessProbe).toContain(
			"probe_generation = dispatch_readiness.probe_generation + 1",
		);
		expect(claimDispatchReadinessProbe).toContain("RETURNING probe_generation");
		expect(completeDispatchReadinessProbe).toContain("probe_token = ?6");
		expect(completeDispatchReadinessProbe).toContain("probe_generation = ?7");
		expect(
			`${claimDispatchReadinessProbe}${completeDispatchReadinessProbe}`,
		).not.toMatch(/DELETE|DROP|REPLACE/i);
	});
});
