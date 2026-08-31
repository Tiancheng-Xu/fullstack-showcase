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

export const stoppedBootstrapSource = "babysteps-performance-control-bootstrap-v1";
export const stoppedBootstrapOperation = "bootstrap-stopped-state";

export type RuntimeSource = "control" | "aws-safety-expiry" | typeof stoppedBootstrapSource;
export type RuntimeStatus = "starting" | "running" | "stopping" | "stopped" | "degraded" | "cleanup_required" | "failed";

export interface StoppedBootstrapProof {
	authority: "github-actions-artifact+aws-zero-residue-readback";
	workflowRunId: string;
	artifactId: string;
	evidenceSha256: string;
	schemaAbsenceVerified: true;
	cloudFormationStackAbsent: true;
	remainingProjectResources: 0;
	sharedFoundationProtected: true;
}

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
	operation?: typeof stoppedBootstrapOperation;
	bootstrapOnly?: true;
	proof?: StoppedBootstrapProof;
	snapshot?: PerformanceSnapshot;
}

const requiredKeys = ["schemaVersion", "deliveryId", "source", "operationId", "generation", "workflowRunId", "status", "occurredAt", "cleanupVerified", "zeroResidualVerified"] as const;
const bootstrapFieldNames = ["operation", "bootstrapOnly", "proof"] as const;
const allowedKeys = new Set<string>([...requiredKeys, ...bootstrapFieldNames, "snapshot"]);
const sources = new Set<RuntimeSource>(["control", "aws-safety-expiry", stoppedBootstrapSource]);
const statuses = new Set<RuntimeStatus>(["starting", "running", "stopping", "stopped", "degraded", "cleanup_required", "failed"]);
const safetyTerminalStatuses = new Set<RuntimeStatus>(["stopped", "cleanup_required", "failed"]);
const bootstrapProofKeys = new Set([
	"authority",
	"workflowRunId",
	"artifactId",
	"evidenceSha256",
	"schemaAbsenceVerified",
	"cloudFormationStackAbsent",
	"remainingProjectResources",
	"sharedFoundationProtected",
]);
const bootstrapDeliveryPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,159}$/u;
const bootstrapOperationIdPattern = /^bootstrap-babysteps-stopped-[A-Za-z0-9._:-]{8,96}$/u;
const decimalIdPattern = /^[1-9][0-9]*$/u;
const sha256Pattern = /^[0-9a-f]{64}$/u;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isStoppedBootstrapProof = (value: unknown): value is StoppedBootstrapProof => {
	if (!isRecord(value) || Object.keys(value).length !== bootstrapProofKeys.size || Object.keys(value).some((key) => !bootstrapProofKeys.has(key))) {
		return false;
	}
	return (
		value.authority === "github-actions-artifact+aws-zero-residue-readback" &&
		decimalIdPattern.test(String(value.workflowRunId ?? "")) &&
		decimalIdPattern.test(String(value.artifactId ?? "")) &&
		sha256Pattern.test(String(value.evidenceSha256 ?? "")) &&
		value.schemaAbsenceVerified === true &&
		value.cloudFormationStackAbsent === true &&
		value.remainingProjectResources === 0 &&
		value.sharedFoundationProtected === true
	);
};
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
	const hasBootstrapFields = bootstrapFieldNames.some((key) => key in value);
	if (value.source === stoppedBootstrapSource) {
		if (
			value.operation !== stoppedBootstrapOperation ||
			!bootstrapDeliveryPattern.test(value.deliveryId) ||
			!bootstrapOperationIdPattern.test(value.operationId) ||
			!decimalIdPattern.test(value.workflowRunId) ||
			value.generation !== 1 ||
			value.status !== "stopped" ||
			value.cleanupVerified !== true ||
			value.zeroResidualVerified !== true ||
			value.bootstrapOnly !== true ||
			value.snapshot !== undefined ||
			!isStoppedBootstrapProof(value.proof)
		) {
			throw new Error("invalid_stopped_bootstrap");
		}
	} else if (hasBootstrapFields) {
		throw new Error("bootstrap_fields_forbidden");
	}
	if (value.source === "aws-safety-expiry" && !safetyTerminalStatuses.has(value.status as RuntimeStatus)) {
		throw new Error("safety_expiry_requires_terminal_status");
	}
	if (value.status === "stopped" && (value.cleanupVerified !== true || value.zeroResidualVerified !== true)) {
		throw new Error("stopped_requires_dual_verification");
	}
	return value as unknown as RuntimeCallback;
};
