export type ControlAction = "start" | "stop";
export type ControlState =
	| "stopped"
	| "starting"
	| "running"
	| "degraded"
	| "stopping"
	| "failed"
	| "cleanup_required";
export type DataMode = "live" | "historical" | "unavailable";

export interface ProjectState {
	projectSlug: string;
	controlState: ControlState;
	dataMode: DataMode;
	generation: number;
	operationId?: string;
	idempotencyKey?: string;
	workflowRunId?: string;
	operationAction?: ControlAction;
	cleanupVerified: boolean;
	expiresAt?: string;
	updatedAt: string;
}

export interface ControlOperation {
	operationId: string;
	projectSlug: string;
	action: ControlAction;
	idempotencyKey: string;
	generation: number;
	requestedAt: string;
	expiresAt?: string;
}

export interface ControlRequest {
	action: ControlAction;
	idempotencyKey: string;
	operationId: string;
	requestedAt: string;
	expiresAt?: string;
}

export type ControlRequestResult =
	| { kind: "accepted"; state: ProjectState; operation: ControlOperation }
	| { kind: "duplicate"; state: ProjectState; operation: ControlOperation }
	| {
			kind: "rejected";
			reason:
				| "cleanup_not_verified"
				| "operation_in_progress"
				| "already_stopped"
				| "not_running"
				| "idempotency_action_conflict";
	  };

export interface WorkflowCallback {
	operationId: string;
	generation: number;
	workflowRunId: string;
	status: "running" | "degraded" | "stopped" | "failed";
	occurredAt: string;
	cleanupVerified?: boolean;
	dataMode?: DataMode;
}

export type CallbackResult =
	| { kind: "applied"; state: ProjectState }
	| { kind: "ignored"; reason: "stale_callback" };

const assertTimestamp = (value: string, field: string) => {
	if (!Number.isFinite(Date.parse(value))) {
		throw new Error(`invalid_${field}`);
	}
};

export const createInitialProjectState = (
	projectSlug: string,
	now = "1970-01-01T00:00:00.000Z",
): ProjectState => ({
	projectSlug,
	controlState: "stopped",
	dataMode: "unavailable",
	generation: 0,
	cleanupVerified: true,
	updatedAt: now,
});

const activeStates: ReadonlySet<ControlState> = new Set([
	"starting",
	"running",
	"degraded",
	"stopping",
]);

const operationFromState = (
	state: ProjectState,
	action: ControlAction,
): ControlOperation => ({
	operationId: state.operationId ?? "",
	projectSlug: state.projectSlug,
	action,
	idempotencyKey: state.idempotencyKey ?? "",
	generation: state.generation,
	requestedAt: state.updatedAt,
	expiresAt: state.expiresAt,
});

export const requestControlOperation = (
	state: ProjectState,
	request: ControlRequest,
): ControlRequestResult => {
	assertTimestamp(request.requestedAt, "requested_at");
	if (request.expiresAt) assertTimestamp(request.expiresAt, "expires_at");

	if (
		state.idempotencyKey === request.idempotencyKey &&
		state.operationId
	) {
		if (state.operationAction && state.operationAction !== request.action) {
			return { kind: "rejected", reason: "idempotency_action_conflict" };
		}
		return {
			kind: "duplicate",
			state,
			operation: operationFromState(state, request.action),
		};
	}

	if (request.action === "start") {
		if (!state.cleanupVerified) {
			return { kind: "rejected", reason: "cleanup_not_verified" };
		}
		if (activeStates.has(state.controlState)) {
			return { kind: "rejected", reason: "operation_in_progress" };
		}
	} else {
		if (state.controlState === "stopped") {
			return { kind: "rejected", reason: "already_stopped" };
		}
		if (!activeStates.has(state.controlState) && state.controlState !== "failed" && state.controlState !== "cleanup_required") {
			return { kind: "rejected", reason: "not_running" };
		}
	}

	const generation = request.action === "start" ? state.generation + 1 : state.generation;
	const operation: ControlOperation = {
		operationId: request.operationId,
		projectSlug: state.projectSlug,
		action: request.action,
		idempotencyKey: request.idempotencyKey,
		generation,
		requestedAt: request.requestedAt,
		expiresAt: request.expiresAt,
	};
	const nextState: ProjectState = {
		...state,
		controlState: request.action === "start" ? "starting" : "stopping",
		generation,
		operationId: request.operationId,
		operationAction: request.action,
		idempotencyKey: request.idempotencyKey,
		workflowRunId: undefined,
		cleanupVerified: request.action === "start" ? false : state.cleanupVerified,
		expiresAt: request.expiresAt,
		updatedAt: request.requestedAt,
	};

	return { kind: "accepted", state: nextState, operation };
};

export const applyWorkflowCallback = (
	state: ProjectState,
	callback: WorkflowCallback,
): CallbackResult => {
	assertTimestamp(callback.occurredAt, "occurred_at");
	const callbackMatches =
		state.operationId === callback.operationId &&
		state.generation === callback.generation &&
		(!state.workflowRunId || state.workflowRunId === callback.workflowRunId);
	if (!callbackMatches) {
		return { kind: "ignored", reason: "stale_callback" };
	}

	const cleanupVerified =
		callback.status === "stopped"
			? callback.cleanupVerified === true
			: callback.status === "failed"
				? false
				: state.cleanupVerified;
	const dataMode =
		callback.dataMode ??
		(callback.status === "running"
			? "live"
			: callback.status === "stopped" && state.dataMode === "live"
				? "historical"
				: state.dataMode);

	return {
		kind: "applied",
		state: {
			...state,
			controlState: callback.status === "failed" ? "cleanup_required" : callback.status,
			dataMode,
			workflowRunId: callback.workflowRunId,
			cleanupVerified,
			expiresAt: callback.status === "running" || callback.status === "degraded" ? state.expiresAt : undefined,
			updatedAt: callback.occurredAt,
		},
	};
};

export const reconcileExpiredOperation = (
	state: ProjectState,
	now: string,
): ProjectState => {
	assertTimestamp(now, "reconcile_time");
	if (
		!state.expiresAt ||
		!activeStates.has(state.controlState) ||
		Date.parse(now) <= Date.parse(state.expiresAt)
	) {
		return state;
	}

	return {
		...state,
		controlState: "cleanup_required",
		cleanupVerified: false,
		expiresAt: undefined,
		updatedAt: now,
	};
};
