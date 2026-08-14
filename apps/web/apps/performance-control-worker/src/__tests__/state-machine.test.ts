import { describe, expect, it } from "vitest";

import {
	applyWorkflowCallback,
	createInitialProjectState,
	reconcileExpiredOperation,
	requestControlOperation,
} from "../state-machine";

describe("performance control state machine", () => {
	it("starts only from a cleanup-verified stopped state", () => {
		const state = createInitialProjectState("showcase-dashboard");
		const result = requestControlOperation(state, {
			action: "start",
			idempotencyKey: "start-2026-08-14",
			operationId: "op-start-1",
			requestedAt: "2026-08-14T10:00:00.000Z",
		});

		expect(result.kind).toBe("accepted");
		if (result.kind !== "accepted") return;
		expect(result.state.controlState).toBe("starting");
		expect(result.state.generation).toBe(1);
		expect(result.state.operationId).toBe("op-start-1");
	});

	it("rejects start when cleanup has not been verified", () => {
		const state = {
			...createInitialProjectState("showcase-dashboard"),
			cleanupVerified: false,
		};
		const result = requestControlOperation(state, {
			action: "start",
			idempotencyKey: "start-unsafe",
			operationId: "op-start-unsafe",
			requestedAt: "2026-08-14T10:00:00.000Z",
		});

		expect(result).toEqual({
			kind: "rejected",
			reason: "cleanup_not_verified",
		});
	});

	it("returns the existing operation for a repeated idempotency key", () => {
		const state = createInitialProjectState("showcase-dashboard");
		const first = requestControlOperation(state, {
			action: "start",
			idempotencyKey: "same-key",
			operationId: "op-start-1",
			requestedAt: "2026-08-14T10:00:00.000Z",
		});
		expect(first.kind).toBe("accepted");
		if (first.kind !== "accepted") return;

		const repeated = requestControlOperation(first.state, {
			action: "start",
			idempotencyKey: "same-key",
			operationId: "op-start-2",
			requestedAt: "2026-08-14T10:00:01.000Z",
		});
		expect(repeated.kind).toBe("duplicate");
		if (repeated.kind !== "duplicate") return;
		expect(repeated.operation.operationId).toBe("op-start-1");
		expect(repeated.state.generation).toBe(1);
	});

	it("ignores stale callbacks unless operation, generation and run all match", () => {
		const state = createInitialProjectState("showcase-dashboard");
		const accepted = requestControlOperation(state, {
			action: "start",
			idempotencyKey: "start-key",
			operationId: "op-start-1",
			requestedAt: "2026-08-14T10:00:00.000Z",
		});
		expect(accepted.kind).toBe("accepted");
		if (accepted.kind !== "accepted") return;

		const bound = applyWorkflowCallback(accepted.state, {
			operationId: "op-start-1",
			generation: 1,
			workflowRunId: "run-101",
			status: "running",
			occurredAt: "2026-08-14T10:01:00.000Z",
		});
		expect(bound.kind).toBe("applied");
		if (bound.kind !== "applied") return;

		const stale = applyWorkflowCallback(bound.state, {
			operationId: "op-start-1",
			generation: 1,
			workflowRunId: "run-100",
			status: "failed",
			occurredAt: "2026-08-14T10:02:00.000Z",
		});
		expect(stale).toEqual({ kind: "ignored", reason: "stale_callback" });
	});

	it("reconciles an expired in-flight operation to failed without faking cleanup", () => {
		const state = createInitialProjectState("showcase-dashboard");
		const accepted = requestControlOperation(state, {
			action: "start",
			idempotencyKey: "start-key",
			operationId: "op-start-1",
			requestedAt: "2026-08-14T10:00:00.000Z",
			expiresAt: "2026-08-14T10:10:00.000Z",
		});
		expect(accepted.kind).toBe("accepted");
		if (accepted.kind !== "accepted") return;

		const reconciled = reconcileExpiredOperation(
			accepted.state,
			"2026-08-14T10:11:00.000Z",
		);
		expect(reconciled.controlState).toBe("failed");
		expect(reconciled.cleanupVerified).toBe(false);
	});
});
