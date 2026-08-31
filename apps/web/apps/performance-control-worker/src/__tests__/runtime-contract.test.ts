import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { createWorkflowDispatchInputs, parseRuntimeCallback, runtimeCallbackHeaders, workflowDispatchInputNames } from "../runtime-contract";

const fixture = JSON.parse(readFileSync(resolve(import.meta.dirname, "../../fixtures/runtime-callback-v1.json"), "utf8"));

const bootstrapProof = {
	authority: "github-actions-artifact+aws-zero-residue-readback",
	workflowRunId: "33279132965",
	artifactId: "9722636468",
	evidenceSha256: "a".repeat(64),
	schemaAbsenceVerified: true,
	cloudFormationStackAbsent: true,
	remainingProjectResources: 0,
	sharedFoundationProtected: true,
};

describe("performance control protocol v1", () => {
	it("freezes exact dispatch inputs and callback headers", () => {
		expect(workflowDispatchInputNames).toEqual(["action", "operation_id", "generation", "expires_at", "estimated_cost_usd"]);
		expect(runtimeCallbackHeaders).toEqual(["x-performance-timestamp", "x-performance-delivery-id", "x-performance-signature-256"]);
		expect(createWorkflowDispatchInputs("stop", "operation-1", 2, "2026-08-26T12:00:00.000Z")).toEqual({ action: "stop", operation_id: "operation-1", generation: "2", expires_at: "2026-08-26T12:00:00.000Z", estimated_cost_usd: "0.20" });
		expect(() => createWorkflowDispatchInputs("stop", "operation-1", 2, undefined as unknown as string)).toThrow("dispatch_expiry_required");
	});

	it("accepts the shared control fixture and requires header/body delivery equality", () => {
		expect(parseRuntimeCallback(fixture, fixture.deliveryId)).toEqual(fixture);
		expect(() => parseRuntimeCallback(fixture, "different-delivery")).toThrow("delivery_id_mismatch");
	});

	it("rejects unknown, missing, or incorrectly typed runtime fields", () => {
		for (const candidate of [
			{ ...fixture, unknown: true },
			{ ...fixture, schemaVersion: 1 },
			{ ...fixture, schemaVersion: "2.0" },
			{ ...fixture, generation: 0 },
			{ ...fixture, cleanupVerified: "false" },
			{ ...fixture, occurredAt: "not-iso" },
			{ ...fixture, workflowRunId: "" },
		]) expect(() => parseRuntimeCallback(candidate, fixture.deliveryId)).toThrow();
	});

	it("allows safety expiry only for terminal states and requires dual verification for stopped", () => {
		expect(() => parseRuntimeCallback({ ...fixture, source: "aws-safety-expiry", status: "running" }, fixture.deliveryId)).toThrow("safety_expiry_requires_terminal_status");
		expect(() => parseRuntimeCallback({ ...fixture, status: "stopped", cleanupVerified: true, zeroResidualVerified: false }, fixture.deliveryId)).toThrow("stopped_requires_dual_verification");
		expect(parseRuntimeCallback({ ...fixture, source: "aws-safety-expiry", status: "stopped", cleanupVerified: true, zeroResidualVerified: true }, fixture.deliveryId).status).toBe("stopped");
	});

	it("accepts only the dedicated first-row stopped bootstrap envelope", () => {
		const bootstrap = {
			...fixture,
			deliveryId: "github-33333333333-1-bootstrap-stopped",
			source: "babysteps-performance-control-bootstrap-v1",
			operation: "bootstrap-stopped-state",
			operationId: "bootstrap-babysteps-stopped-33333333333",
			generation: 1,
			workflowRunId: "33333333333",
			status: "stopped",
			cleanupVerified: true,
			zeroResidualVerified: true,
			bootstrapOnly: true,
			proof: bootstrapProof,
		};

		expect(parseRuntimeCallback(bootstrap, bootstrap.deliveryId)).toEqual(bootstrap);
		for (const candidate of [
			{ ...bootstrap, operation: "stop" },
			{ ...bootstrap, deliveryId: "short" },
			{ ...bootstrap, operationId: "ordinary-stop" },
			{ ...bootstrap, workflowRunId: "run-bootstrap" },
			{ ...bootstrap, generation: 2 },
			{ ...bootstrap, status: "running" },
			{ ...bootstrap, bootstrapOnly: false },
			{ ...bootstrap, proof: { ...bootstrapProof, remainingProjectResources: 1 } },
			{ ...bootstrap, proof: { ...bootstrapProof, unexpected: true } },
			{ ...bootstrap, proof: undefined },
			{ ...bootstrap, snapshot: {} },
		]) {
			expect(() => parseRuntimeCallback(candidate, candidate.deliveryId)).toThrow("invalid_stopped_bootstrap");
		}
		expect(() => parseRuntimeCallback({ ...fixture, bootstrapOnly: true }, fixture.deliveryId)).toThrow("bootstrap_fields_forbidden");
	});
});
