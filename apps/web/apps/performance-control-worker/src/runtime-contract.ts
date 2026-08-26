import type { PerformanceSnapshot } from "./snapshot";

export const workflowDispatchInputNames = [
	"action",
	"operation_id",
	"generation",
	"expires_at",
	"estimated_cost_usd",
] as const;

export const runtimeCallbackHeaders = [
	"x-performance-timestamp",
	"x-performance-delivery-id",
	"x-performance-signature-256",
] as const;

export type RuntimeSource = "control" | "aws-safety-expiry";
export type RuntimeStatus = "starting" | "running" | "stopping" | "stopped" | "degraded" | "cleanup_required" | "failed";

export interface RuntimeCallback {
	schemaVersion: "1.0";
	deliveryId: string;
	source: RuntimeSource;
	operationId: string;
	generation: number;
	workflowRunId: string;
	status: RuntimeStatus;
	occurredAt: string;
	cleanupVerified: boolean;
	zeroResidualVerified: boolean;
	snapshot?: PerformanceSnapshot;
}

const requiredKeys = ["schemaVersion", "deliveryId", "source", "operationId", "generation", "workflowRunId", "status", "occurredAt", "cleanupVerified", "zeroResidualVerified"] as const;
const allowedKeys = new Set<string>([...requiredKeys, "snapshot"]);
const sources = new Set<RuntimeSource>(["control", "aws-safety-expiry"]);
const statuses = new Set<RuntimeStatus>(["starting", "running", "stopping", "stopped", "degraded", "cleanup_required", "failed"]);
const safetyTerminalStatuses = new Set<RuntimeStatus>(["stopped", "cleanup_required", "failed"]);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
export const isCanonicalIso = (value: unknown): value is string => {
	if (typeof value !== "string") return false;
	const timestamp = Date.parse(value);
	return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
};

export const createWorkflowDispatchInputs = (
	action: "start" | "stop",
	operationId: string,
	generation: number,
	expiresAt: string,
) => {
	if (!isCanonicalIso(expiresAt)) throw new Error("dispatch_expiry_required");
	return {
		action,
		operation_id: operationId,
		generation: String(generation),
		expires_at: expiresAt,
		estimated_cost_usd: "0.20",
	};
};

export const parseRuntimeCallback = (value: unknown, headerDeliveryId: string): RuntimeCallback => {
	if (!isRecord(value)) throw new Error("invalid_runtime_callback");
	if (Object.keys(value).some((key) => !allowedKeys.has(key)) || requiredKeys.some((key) => !(key in value))) {
		throw new Error("invalid_runtime_callback_fields");
	}
	if (value.schemaVersion !== "1.0") throw new Error("invalid_schema_version");
	if (!isNonEmptyString(value.deliveryId) || value.deliveryId !== headerDeliveryId) throw new Error("delivery_id_mismatch");
	if (!isNonEmptyString(value.operationId) || !Number.isInteger(value.generation) || Number(value.generation) <= 0 || !isNonEmptyString(value.workflowRunId)) {
		throw new Error("invalid_runtime_identity");
	}
	if (!sources.has(value.source as RuntimeSource) || !statuses.has(value.status as RuntimeStatus)) throw new Error("invalid_runtime_state");
	if (!isCanonicalIso(value.occurredAt) || typeof value.cleanupVerified !== "boolean" || typeof value.zeroResidualVerified !== "boolean") {
		throw new Error("invalid_runtime_evidence");
	}
	if (value.snapshot !== undefined && !isRecord(value.snapshot)) throw new Error("invalid_runtime_snapshot");
	if (value.source === "aws-safety-expiry" && !safetyTerminalStatuses.has(value.status as RuntimeStatus)) {
		throw new Error("safety_expiry_requires_terminal_status");
	}
	if (value.status === "stopped" && (value.cleanupVerified !== true || value.zeroResidualVerified !== true)) {
		throw new Error("stopped_requires_dual_verification");
	}
	return value as unknown as RuntimeCallback;
};
