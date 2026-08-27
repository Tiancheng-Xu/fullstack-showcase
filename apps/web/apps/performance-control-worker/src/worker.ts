import {
	getRegisteredProject,
	type RegisteredPerformanceProject,
} from "./registry";
import { createWorkflowDispatchInputs, isCanonicalIso, parseRuntimeCallback, type RuntimeCallback } from "./runtime-contract";
import {
	assertSnapshotPublishable,
	type PerformanceSnapshot,
} from "./snapshot";
import {
	applyWorkflowCallback,
	createInitialProjectState,
	requestControlOperation,
	type ControlAction,
	type ProjectState,
} from "./state-machine";
import { verifyTotpCode } from "./totp";

export interface D1RunResultLike {
	success?: boolean;
	meta?: { changes?: number };
}
export interface D1PreparedStatementLike {
	bind(...values: unknown[]): D1PreparedStatementLike;
	first<T>(): Promise<T | null>;
	run<T = D1RunResultLike>(): Promise<T>;
	all?<T>(): Promise<{ results: T[] }>;
}
export interface D1DatabaseLike {
	prepare(query: string): D1PreparedStatementLike;
	batch?(statements: D1PreparedStatementLike[]): Promise<D1RunResultLike[]>;
}
export interface R2ObjectLike {
	text(): Promise<string>;
}
export interface R2BucketLike {
	get(key: string): Promise<R2ObjectLike | null>;
	put(
		key: string,
		value: string,
		options?: { onlyIf?: { etagDoesNotMatch?: string } },
	): Promise<unknown | null>;
}
export interface WorkerEnv {
	CONTROL_DB: D1DatabaseLike;
	SNAPSHOTS: R2BucketLike;
	CONTROL_ENABLED?: string;
	CONTROL_ORIGIN?: string;
	TOTP_SECRET?: string;
	GITHUB_APP_ID?: string;
	GITHUB_APP_INSTALLATION_ID?: string;
	GITHUB_APP_PRIVATE_KEY?: string;
	CALLBACK_HMAC_SECRET?: string;
}

interface StateRow {
	project_slug: string;
	control_state: string;
	data_mode: string;
	generation?: number;
	operation_id?: string | null;
	idempotency_key?: string | null;
	workflow_run_id?: string | null;
	cleanup_verified: number;
	expires_at?: string | null;
	snapshot_sha256: string | null;
	snapshot_key?: string | null;
	estimated_cost_usd?: number;
	last_event_at?: string | null;
	updated_at: string;
}
interface NonceRow {
	nonce: string;
	consumed_at: string | null;
	expires_at: string;
}
interface TotpAttemptRow {
	failure_count: number;
	window_started_at: string;
	locked_until: string | null;
}
const digestPattern = /^[a-f0-9]{64}$/;
const idempotencyPattern = /^[A-Za-z0-9._:-]{8,128}$/;
const encoder = new TextEncoder();
const callbackLimitBytes = 256 * 1024;
const clockSkewSeconds = 60;

const json = (body: unknown, init: ResponseInit = {}) => {
	const headers = new Headers(init.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	headers.set("x-content-type-options", "nosniff");
	headers.set("referrer-policy", "no-referrer");
	return new Response(JSON.stringify(body), { ...init, headers });
};

const projectFrom = (url: URL) => {
	const projectSlug = url.searchParams.get("project") ?? "";
	return { projectSlug, project: getRegisteredProject(projectSlug) };
};

const sha256 = async (value: string) => {
	const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
};

const decodeBase64Url = (value: string) => {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
};

const configured = (env: WorkerEnv) =>
	env.CONTROL_ENABLED === "true" &&
	Boolean(
		env.CONTROL_ORIGIN &&
			env.TOTP_SECRET &&
			env.GITHUB_APP_ID &&
			env.GITHUB_APP_INSTALLATION_ID &&
			env.GITHUB_APP_PRIVATE_KEY &&
			env.CALLBACK_HMAC_SECRET,
	);

const recordTotpFailure = async (env: WorkerEnv) => {
	const now = new Date();
	let previous: TotpAttemptRow | null = null;
	try {
		previous = await env.CONTROL_DB.prepare(
			"SELECT failure_count, window_started_at, locked_until FROM totp_attempts WHERE scope='operator'",
		).first<TotpAttemptRow>();
	} catch {
		return json({ error: "totp_verification_unavailable" }, { status: 503 });
	}
	const windowStartedAt = previous ? Date.parse(previous.window_started_at) : 0;
	const inWindow = Number.isFinite(windowStartedAt) && now.getTime() - windowStartedAt < 5 * 60_000;
	const failureCount = inWindow ? (previous?.failure_count ?? 0) + 1 : 1;
	const startedAt = inWindow && previous ? previous.window_started_at : now.toISOString();
	const lockedUntil = failureCount >= 5 ? new Date(now.getTime() + 10 * 60_000).toISOString() : null;
	try {
		await env.CONTROL_DB.prepare(
			`INSERT INTO totp_attempts (scope, failure_count, window_started_at, locked_until)
			 VALUES ('operator', ?1, ?2, ?3)
			 ON CONFLICT(scope) DO UPDATE SET failure_count=?1, window_started_at=?2, locked_until=?3`,
		)
			.bind(failureCount, startedAt, lockedUntil)
			.run();
	} catch {
		return json({ error: "totp_verification_unavailable" }, { status: 503 });
	}
	return lockedUntil
		? json({ error: "totp_rate_limited" }, { status: 429 })
		: json({ error: "totp_invalid" }, { status: 401 });
};

const verifyAccess = async (
	request: Request,
	env: WorkerEnv,
): Promise<{ actorHash: string } | Response> => {
	const code = request.headers.get("x-control-totp") ?? "";
	if (!code) return json({ error: "totp_required" }, { status: 401 });
	if (!env.TOTP_SECRET) {
		return json({ error: "control_not_configured" }, { status: 503 });
	}
	if (!(await verifyTotpCode(env.TOTP_SECRET, code))) return recordTotpFailure(env);
	return { actorHash: await sha256(`totp:${env.TOTP_SECRET}`) };
};

const publicStatus = async (url: URL, env: WorkerEnv) => {
	const { projectSlug, project } = projectFrom(url);
	if (!project) return json({ error: "unknown_project" }, { status: 404 });
	let row: StateRow | null = null;
	try {
		row = await env.CONTROL_DB.prepare(
			`SELECT project_slug, control_state, data_mode, generation, operation_id,
			        workflow_run_id, cleanup_verified, expires_at, snapshot_sha256,
			        estimated_cost_usd, updated_at
			   FROM project_state WHERE project_slug = ?1`,
		)
			.bind(projectSlug)
			.first<StateRow>();
	} catch {
		row = null;
	}
	return json(
		row
			? {
					projectSlug: row.project_slug,
					controlState: row.control_state,
					dataMode: row.data_mode,
					cleanupVerified: row.cleanup_verified === 1,
					snapshotAvailable: Boolean(row.snapshot_sha256),
					expiresAt: row.expires_at ?? null,
					estimatedCostUsd: row.estimated_cost_usd ?? project.estimatedCostUsd,
					maximumRuntimeMinutes: project.maximumRuntimeMinutes,
					updatedAt: row.updated_at,
					metrics: [],
				}
			: {
					projectSlug,
					controlState: "unknown",
					dataMode: "unavailable",
					cleanupVerified: false,
					snapshotAvailable: false,
					expiresAt: null,
					estimatedCostUsd: project.estimatedCostUsd,
					maximumRuntimeMinutes: project.maximumRuntimeMinutes,
					updatedAt: null,
					metrics: [],
				},
		{ headers: { "cache-control": "public, max-age=15" } },
	);
};

const publicSnapshot = async (request: Request, url: URL, env: WorkerEnv) => {
	const { projectSlug, project } = projectFrom(url);
	if (!project) return json({ error: "unknown_project" }, { status: 404 });
	const pointer = await env.CONTROL_DB.prepare(
		"SELECT snapshot_key, snapshot_sha256 FROM project_state WHERE project_slug = ?1",
	)
		.bind(projectSlug)
		.first<{ snapshot_key: string | null; snapshot_sha256: string | null }>();
	if (!pointer?.snapshot_key || !pointer.snapshot_sha256) {
		return json({ error: "verified_snapshot_not_found" }, { status: 404 });
	}
	const prefix = `performance/${projectSlug}/operations/`;
	if (
		!pointer.snapshot_key.startsWith(prefix) ||
		!pointer.snapshot_key.endsWith(".json") ||
		pointer.snapshot_key.includes("..") ||
		!digestPattern.test(pointer.snapshot_sha256)
	) {
		return json({ error: "invalid_snapshot_pointer" }, { status: 502 });
	}
	if (request.headers.get("if-none-match") === `"${pointer.snapshot_sha256}"`) {
		return new Response(null, {
			status: 304,
			headers: { etag: `"${pointer.snapshot_sha256}"` },
		});
	}
	const object = await env.SNAPSHOTS.get(pointer.snapshot_key);
	if (!object) return json({ error: "snapshot_object_missing" }, { status: 502 });
	const raw = await object.text();
	if ((await sha256(raw)) !== pointer.snapshot_sha256) {
		return json({ error: "snapshot_digest_mismatch" }, { status: 502 });
	}
	try {
		const snapshot = JSON.parse(raw) as PerformanceSnapshot;
		assertSnapshotPublishable(snapshot, { immutableObjectExists: false });
		if (snapshot.projectSlug !== projectSlug) throw new Error("project_mismatch");
		return json(snapshot, {
			headers: {
				"cache-control": "public, max-age=60, stale-if-error=86400",
				etag: `"${pointer.snapshot_sha256}"`,
			},
		});
	} catch {
		return json({ error: "invalid_snapshot_contract" }, { status: 502 });
	}
};

const createSession = async (request: Request, url: URL, env: WorkerEnv) => {
	const { projectSlug, project } = projectFrom(url);
	if (!project) return json({ error: "unknown_project" }, { status: 404 });
	if (!configured(env)) {
		return json({ error: "control_not_configured" }, { status: 503 });
	}
	if (request.headers.get("origin") !== env.CONTROL_ORIGIN) {
		return json({ error: "origin_not_allowed" }, { status: 403 });
	}
	const access = await verifyAccess(request, env);
	if (access instanceof Response) return access;
	const nonce = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
	await env.CONTROL_DB.prepare(
		"INSERT INTO control_nonces (nonce, project_slug, actor_subject_hash, expires_at) VALUES (?1, ?2, ?3, ?4)",
	)
		.bind(nonce, projectSlug, access.actorHash, expiresAt)
		.run();
	return json(
		{
			nonce,
			expiresAt,
			mfaVerified: true,
			maximumRuntimeMinutes: project.maximumRuntimeMinutes,
			estimatedCostUsd: project.estimatedCostUsd,
		},
		{ headers: { "cache-control": "no-store" } },
	);
};

const rowToState = (row: StateRow | null, projectSlug: string): ProjectState => {
	if (!row) return createInitialProjectState(projectSlug, new Date().toISOString());
	return {
		projectSlug: row.project_slug,
		controlState: row.control_state as ProjectState["controlState"],
		dataMode: row.data_mode as ProjectState["dataMode"],
		generation: row.generation ?? 0,
		operationId: row.operation_id ?? undefined,
		idempotencyKey: row.idempotency_key ?? undefined,
		workflowRunId: row.workflow_run_id ?? undefined,
		cleanupVerified: row.cleanup_verified === 1,
		expiresAt: row.expires_at ?? undefined,
		updatedAt: row.updated_at,
	};
};

const encodeBase64Url = (value: Uint8Array | string) => {
	const bytes = typeof value === "string" ? encoder.encode(value) : value;
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};

const githubAppJwt = async (env: WorkerEnv) => {
	if (!env.GITHUB_APP_ID || !env.GITHUB_APP_PRIVATE_KEY) {
		throw new Error("github_app_not_configured");
	}
	const pem = env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n");
	const base64 = pem
		.replace("-----BEGIN PRIVATE KEY-----", "")
		.replace("-----END PRIVATE KEY-----", "")
		.replace(/\s/g, "");
	const key = await crypto.subtle.importKey(
		"pkcs8",
		Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)),
		{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
		false,
		["sign"],
	);
	const now = Math.floor(Date.now() / 1000);
	const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
	const payload = encodeBase64Url(
		JSON.stringify({ iat: now - 60, exp: now + 540, iss: env.GITHUB_APP_ID }),
	);
	const signingInput = `${header}.${payload}`;
	const signature = await crypto.subtle.sign(
		"RSASSA-PKCS1-v1_5",
		key,
		encoder.encode(signingInput),
	);
	return `${signingInput}.${encodeBase64Url(new Uint8Array(signature))}`;
};

const githubInstallationToken = async (env: WorkerEnv) => {
	if (!env.GITHUB_APP_INSTALLATION_ID) throw new Error("github_app_not_configured");
	const response = await fetch(
		`https://api.github.com/app/installations/${env.GITHUB_APP_INSTALLATION_ID}/access_tokens`,
		{
			method: "POST",
			headers: {
				accept: "application/vnd.github+json",
				authorization: `Bearer ${await githubAppJwt(env)}`,
				"x-github-api-version": "2022-11-28",
			},
			body: JSON.stringify({
				repositories: ["babysteps"],
				permissions: { actions: "write", metadata: "read" },
			}),
		},
	);
	if (!response.ok) throw new Error("github_token_exchange_failed");
	const body = (await response.json()) as { token?: string };
	if (!body.token) throw new Error("github_token_exchange_failed");
	return body.token;
};

const dispatchFixedWorkflow = async (
	env: WorkerEnv,
	project: RegisteredPerformanceProject,
	action: ControlAction,
	operationId: string,
	generation: number,
	expiresAt: string,
) => {
	const installationToken = await githubInstallationToken(env);
	const response = await fetch(
		`https://api.github.com/repos/${project.repository}/actions/workflows/${project.workflow}/dispatches`,
		{
			method: "POST",
			headers: {
				accept: "application/vnd.github+json",
				authorization: `Bearer ${installationToken}`,
				"content-type": "application/json",
				"x-github-api-version": "2022-11-28",
			},
			body: JSON.stringify({
				ref: "main",
				inputs: createWorkflowDispatchInputs(action, operationId, generation, expiresAt),
			}),
		},
	);
	if (response.status !== 204) throw new Error("github_dispatch_failed");
};

const batchedControlMutation = async (
	request: Request,
	url: URL,
	env: WorkerEnv,
	action: ControlAction,
) => {
	const { projectSlug, project } = projectFrom(url);
	if (!project) return json({ error: "unknown_project" }, { status: 404 });
	if (!configured(env) || !env.CONTROL_DB.batch) return json({ error: "control_not_configured" }, { status: 503 });
	if (request.headers.get("origin") !== env.CONTROL_ORIGIN) return json({ error: "origin_not_allowed" }, { status: 403 });
	const access = await verifyAccess(request, env);
	if (access instanceof Response) return access;
	const nonce = request.headers.get("x-control-nonce") ?? "";
	const idempotencyKey = request.headers.get("idempotency-key") ?? "";
	if (!nonce || !idempotencyPattern.test(idempotencyKey)) return json({ error: "invalid_control_proof" }, { status: 403 });
	let row: StateRow | null;
	try {
		row = await env.CONTROL_DB.prepare("SELECT * FROM project_state WHERE project_slug=?1")
			.bind(projectSlug)
			.first<StateRow>();
	} catch {
		return json({ error: "state_unavailable" }, { status: 503 });
	}
	if (!row) return json({ error: "state_not_bootstrapped" }, { status: 409 });
	const requestedAt = new Date().toISOString();
	const currentState = rowToState(row, projectSlug);
	if (row.idempotency_key === idempotencyKey && row.operation_id) {
		let existingOperation: { action: ControlAction } | null;
		try {
			existingOperation = await env.CONTROL_DB.prepare(
				"SELECT action FROM operations WHERE operation_id=?1 AND project_slug=?2 AND idempotency_key=?3",
			).bind(row.operation_id, projectSlug, idempotencyKey).first<{ action: ControlAction }>();
		} catch {
			return json({ error: "idempotency_state_unavailable" }, { status: 503 });
		}
		if (!existingOperation) return json({ error: "idempotency_state_conflict" }, { status: 409 });
		currentState.operationAction = existingOperation.action;
	}
	const expiresAt = action === "start" ? new Date(Date.now() + project.maximumRuntimeMinutes * 60_000).toISOString() : row.expires_at;
	if (!isCanonicalIso(expiresAt)) return json({ error: "active_expiry_required" }, { status: 409 });
	const result = requestControlOperation(currentState, {
		action,
		idempotencyKey,
		operationId: crypto.randomUUID(),
		requestedAt,
		expiresAt,
	});
	if (result.kind === "rejected") return json({ error: result.reason }, { status: 409 });
	if (result.kind === "duplicate") return json({ ...result.state, duplicate: true });
	const nonceClaim = env.CONTROL_DB.prepare(
		`UPDATE control_nonces SET consumed_at=?1, consumed_by_operation_id=?2
		 WHERE nonce=?3 AND project_slug=?4 AND actor_subject_hash=?5
		 AND consumed_at IS NULL AND expires_at > ?1`,
	).bind(requestedAt, result.operation.operationId, nonce, projectSlug, access.actorHash);
	const stateClaim = env.CONTROL_DB.prepare(
		`UPDATE project_state SET control_state=?1, data_mode=?2, generation=?3,
		 operation_id=?4, idempotency_key=?5, workflow_run_id=NULL, cleanup_verified=?6,
		 expires_at=?7, estimated_cost_usd=?8, updated_at=?9
		 WHERE project_slug=?10 AND generation=?11 AND control_state=?12
		 AND EXISTS (SELECT 1 FROM control_nonces WHERE nonce=?13
		 AND consumed_by_operation_id=?4 AND consumed_at=?9)`,
	).bind(result.state.controlState, result.state.dataMode, result.state.generation, result.state.operationId, result.state.idempotencyKey, result.state.cleanupVerified ? 1 : 0, result.state.expiresAt ?? null, project.estimatedCostUsd, requestedAt, projectSlug, row.generation ?? 0, row.control_state, nonce);
	const operationInsert = env.CONTROL_DB.prepare(
		`INSERT INTO operations (operation_id, project_slug, action, idempotency_key,
		 generation, actor_subject_hash, estimated_cost_usd, requested_at)
		 SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8
		 WHERE EXISTS (SELECT 1 FROM project_state WHERE project_slug=?2
		 AND operation_id=?1 AND generation=?5 AND control_state=?9)`,
	).bind(result.operation.operationId, projectSlug, action, idempotencyKey, result.operation.generation, access.actorHash, project.estimatedCostUsd, requestedAt, result.state.controlState);
	const atomicGuard = env.CONTROL_DB.prepare(
		`INSERT INTO control_batch_guards (operation_id, valid)
		 SELECT ?1, CASE WHEN
		 EXISTS (SELECT 1 FROM control_nonces WHERE nonce=?2 AND consumed_by_operation_id=?1)
		 AND EXISTS (SELECT 1 FROM project_state WHERE project_slug=?3 AND operation_id=?1 AND generation=?4)
		 AND EXISTS (SELECT 1 FROM operations WHERE operation_id=?1 AND generation=?4)
		 THEN 1 ELSE 0 END`,
	).bind(result.operation.operationId, nonce, projectSlug, result.operation.generation);
	let batchResults: D1RunResultLike[];
	try {
		batchResults = await env.CONTROL_DB.batch([nonceClaim, stateClaim, operationInsert, atomicGuard]);
	} catch {
		return json({ error: "control_batch_conflict" }, { status: 409 });
	}
	if (batchResults.length !== 4 || batchResults.some((entry) => entry.meta?.changes !== 1)) {
		return json({ error: "control_batch_conflict" }, { status: 409 });
	}
	try {
		await dispatchFixedWorkflow(env, project, action, result.operation.operationId, result.operation.generation, expiresAt);
	} catch {
		await env.CONTROL_DB.prepare(
			"UPDATE project_state SET control_state='cleanup_required', cleanup_verified=0, expires_at=NULL, updated_at=?1 WHERE project_slug=?2 AND operation_id=?3 AND generation=?4 AND control_state IN ('starting','stopping')",
		).bind(requestedAt, projectSlug, result.operation.operationId, result.operation.generation).run();
		return json({ error: "dispatch_failed", cleanupRequired: true }, { status: 502 });
	}
	return json({ projectSlug, controlState: result.state.controlState, operationId: result.operation.operationId, generation: result.operation.generation, expiresAt: result.state.expiresAt ?? null, estimatedCostUsd: project.estimatedCostUsd }, { status: 202, headers: { "cache-control": "no-store" } });
};

const verifyCallback = async (
	raw: string,
	signature: string | null,
	secret?: string,
) => {
	if (!secret || !signature?.startsWith("sha256=")) return false;
	const supplied = signature.slice(7);
	if (!digestPattern.test(supplied)) return false;
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"],
	);
	const bytes = Uint8Array.from(supplied.match(/../g) ?? [], (hex) =>
		Number.parseInt(hex, 16),
	);
	return crypto.subtle.verify("HMAC", key, bytes, encoder.encode(raw));
};

const readBoundedCallbackBody = async (request: Request) => {
	const declaredLength = request.headers.get("content-length");
	if (declaredLength !== null) {
		const length = Number(declaredLength);
		if (!Number.isInteger(length) || length < 0) throw new Error("invalid_content_length");
		if (length > callbackLimitBytes) throw new Error("callback_too_large");
	}
	if (!request.body) return "";
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > callbackLimitBytes) {
			await reader.cancel();
			throw new Error("callback_too_large");
		}
		chunks.push(value);
	}
	const merged = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		merged.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder().decode(merged);
};

const callbackTransitions: Record<string, ReadonlySet<string>> = {
	starting: new Set(["starting", "running", "degraded", "stopping", "cleanup_required"]),
	running: new Set(["running", "degraded", "stopping", "cleanup_required"]),
	degraded: new Set(["running", "degraded", "stopping", "cleanup_required"]),
	stopping: new Set(["stopping", "stopped", "cleanup_required"]),
	failed: new Set(["stopping", "cleanup_required"]),
	stopped: new Set(["stopped"]),
	cleanup_required: new Set(["stopping", "stopped", "cleanup_required"]),
};

const secureWorkflowCallback = async (request: Request, env: WorkerEnv) => {
	let raw: string;
	try {
		raw = await readBoundedCallbackBody(request);
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : "invalid_callback" },
			{ status: error instanceof Error && error.message === "callback_too_large" ? 413 : 400 },
		);
	}
	const timestamp = request.headers.get("x-performance-timestamp") ?? "";
	const deliveryId = request.headers.get("x-performance-delivery-id") ?? "";
	const timestampSeconds = Number(timestamp);
	if (
		!deliveryId ||
		!Number.isInteger(timestampSeconds) ||
		Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > 300 ||
		!(await verifyCallback(
			`${timestamp}.${raw}`,
			request.headers.get("x-performance-signature-256"),
			env.CALLBACK_HMAC_SECRET,
		))
	) {
		return json({ error: "invalid_or_stale_callback" }, { status: 401 });
	}
	let body: RuntimeCallback;
	try {
		body = parseRuntimeCallback(JSON.parse(raw), deliveryId);
	} catch {
		return json({ error: "invalid_runtime_callback" }, { status: 400 });
	}
	const bodyDigest = await sha256(raw);
	const claimedAt = new Date().toISOString();
	const leaseCutoff = new Date(Date.now() - 5 * 60_000).toISOString();
	const deliveryClaim = await env.CONTROL_DB.prepare(
		`INSERT INTO callback_deliveries
		 (delivery_id, body_sha256, status, claimed_at, applied_at, attempts)
		 VALUES (?1, ?2, 'processing', ?3, NULL, 1)
		 ON CONFLICT(delivery_id) DO NOTHING`,
	)
		.bind(deliveryId, bodyDigest, claimedAt)
		.run<D1RunResultLike>();
	if (deliveryClaim.meta?.changes !== 1) {
		const existingDelivery = await env.CONTROL_DB.prepare(
			"SELECT body_sha256, status, claimed_at, applied_at, attempts FROM callback_deliveries WHERE delivery_id=?1",
		)
			.bind(deliveryId)
			.first<{ body_sha256: string; status: string; claimed_at: string; applied_at: string | null; attempts: number }>();
		if (!existingDelivery || existingDelivery.body_sha256 !== bodyDigest) {
			return json({ error: "callback_delivery_conflict" }, { status: 409 });
		}
		if (existingDelivery.status === "applied") {
			return json({ applied: false, duplicate: true });
		}
		if (existingDelivery.status === "processing" && Date.parse(existingDelivery.claimed_at) > Date.parse(leaseCutoff)) {
			return json({ error: "callback_delivery_processing" }, { status: 409 });
		}
		const reclaimed = await env.CONTROL_DB.prepare(
			`UPDATE callback_deliveries SET status='processing', claimed_at=?1,
			 applied_at=NULL, attempts=attempts+1
			 WHERE delivery_id=?2 AND body_sha256=?3
			 AND (status='failed' OR (status='processing' AND claimed_at<=?4))`,
		)
			.bind(claimedAt, deliveryId, bodyDigest, leaseCutoff)
			.run<D1RunResultLike>();
		if (reclaimed.meta?.changes !== 1) return json({ error: "callback_delivery_conflict" }, { status: 409 });
	}
	const failDelivery = async (error: string, status: number) => {
		await env.CONTROL_DB.prepare(
			"UPDATE callback_deliveries SET status='failed', applied_at=NULL WHERE delivery_id=?1 AND body_sha256=?2 AND status='processing'",
		).bind(deliveryId, bodyDigest).run();
		return json({ error }, { status });
	};
	const projectSlug = body.snapshot?.projectSlug ?? "performance-observability-control";
	if (!getRegisteredProject(projectSlug)) return failDelivery("unknown_project", 404);
	const row = await env.CONTROL_DB.prepare("SELECT * FROM project_state WHERE project_slug=?1")
		.bind(projectSlug)
		.first<StateRow>();
	if (!row) {
		if (body.source !== "aws-safety-expiry" || body.status !== "stopped" || body.cleanupVerified !== true || body.zeroResidualVerified !== true) {
			return failDelivery("bootstrap_requires_zero_residual_verification", 409);
		}
		if (!env.CONTROL_DB.batch) return failDelivery("callback_atomic_unavailable", 503);
		const bootstrapInsert = env.CONTROL_DB.prepare(
			`INSERT INTO project_state (project_slug, control_state, data_mode, generation,
			 operation_id, workflow_run_id, cleanup_verified, estimated_cost_usd, updated_at, last_event_at)
			 VALUES (?1, 'stopped', 'unavailable', ?2, ?3, ?4, 1, 0.20, ?5, ?5)
			 ON CONFLICT(project_slug) DO NOTHING`,
		).bind(projectSlug, body.generation, body.operationId, body.workflowRunId, body.occurredAt);
		const deliveryFinalize = env.CONTROL_DB.prepare(
			"UPDATE callback_deliveries SET status='applied', applied_at=?1 WHERE delivery_id=?2 AND body_sha256=?3 AND status='processing'",
		).bind(body.occurredAt, deliveryId, bodyDigest);
		const bootstrapGuard = env.CONTROL_DB.prepare(
			`INSERT INTO control_batch_guards (operation_id, valid)
			 SELECT ?1, CASE WHEN
			 EXISTS (SELECT 1 FROM project_state WHERE project_slug=?2 AND control_state='stopped'
			   AND generation=?3 AND operation_id=?4 AND workflow_run_id=?5
			   AND cleanup_verified=1 AND updated_at=?6 AND last_event_at=?6)
			 AND EXISTS (SELECT 1 FROM callback_deliveries WHERE delivery_id=?7
			   AND body_sha256=?8 AND status='applied' AND applied_at=?6)
			 THEN 1 ELSE 0 END`,
		).bind(`callback:${deliveryId}`, projectSlug, body.generation, body.operationId, body.workflowRunId, body.occurredAt, deliveryId, bodyDigest);
		let bootstrapResults: D1RunResultLike[];
		try {
			bootstrapResults = await env.CONTROL_DB.batch([bootstrapInsert, deliveryFinalize, bootstrapGuard]);
		} catch {
			return failDelivery("callback_delivery_finalize_conflict", 409);
		}
		if (bootstrapResults.length !== 3 || bootstrapResults.some((result) => result.meta?.changes !== 1)) {
			return failDelivery("callback_delivery_finalize_conflict", 409);
		}
		return json({ applied: true, bootstrapped: true, controlState: "stopped" });
	}
	const nextControlState =
		body.status === "failed" ? "cleanup_required" : body.status;
	const occurredAtMs = Date.parse(body.occurredAt);
	if (!Number.isFinite(occurredAtMs)) return failDelivery("invalid_occurred_at", 400);
	const previousEventAt = row.last_event_at ?? row.updated_at;
	if (occurredAtMs <= Date.parse(previousEventAt)) {
		return failDelivery("invalid_callback_transition", 409);
	}
	if (Math.abs(occurredAtMs - timestampSeconds * 1000) > 10 * 60_000 || occurredAtMs > Date.now() + clockSkewSeconds * 1000) {
		return failDelivery("occurred_at_out_of_window", 400);
	}
	if (body.source === "control") {
		if (!callbackTransitions[row.control_state]?.has(nextControlState)) return failDelivery("invalid_callback_transition", 409);
		const operationRun = await env.CONTROL_DB.prepare(
			`UPDATE operations SET workflow_run_id=COALESCE(workflow_run_id, ?1)
			 WHERE operation_id=?2 AND generation=?3
			   AND (workflow_run_id IS NULL OR workflow_run_id=?1)`,
		).bind(body.workflowRunId, body.operationId, body.generation).run<D1RunResultLike>();
		if (operationRun.meta?.changes !== 1) return failDelivery("workflow_run_conflict", 409);
	} else if (body.generation < (row.generation ?? 0)) {
		return failDelivery("stale_safety_expiry", 409);
	}
	let snapshotDigest: string | null = null;
	let snapshotKey: string | null = null;
	if (body.snapshot) {
		if (body.snapshot.repository !== "Tiancheng-Xu/babysteps" || body.snapshot.workflowRunId !== body.workflowRunId) {
			return failDelivery("snapshot_source_mismatch", 400);
		}
		try {
			assertSnapshotPublishable(body.snapshot, { immutableObjectExists: false });
		} catch {
			return failDelivery("invalid_snapshot", 400);
		}
		const snapshotRaw = JSON.stringify(body.snapshot);
		snapshotDigest = await sha256(snapshotRaw);
		snapshotKey = `performance/${projectSlug}/operations/${body.operationId}/generations/${body.generation}/${snapshotDigest}.json`;
		const reserved = await env.CONTROL_DB.prepare(
			`UPDATE operations SET snapshot_sha256=COALESCE(snapshot_sha256, ?1)
			 WHERE operation_id=?2 AND generation=?3
			   AND (snapshot_sha256 IS NULL OR snapshot_sha256=?1)`,
		)
			.bind(snapshotDigest, body.operationId, body.generation)
			.run<D1RunResultLike>();
		if (reserved.meta?.changes !== 1) return failDelivery("operation_snapshot_conflict", 409);
		const existing = await env.SNAPSHOTS.get(snapshotKey);
		if (existing) {
			if ((await sha256(await existing.text())) !== snapshotDigest) {
				return failDelivery("immutable_snapshot_conflict", 409);
			}
		} else {
			try {
				const created = await env.SNAPSHOTS.put(snapshotKey, snapshotRaw, { onlyIf: { etagDoesNotMatch: "*" } });
				if (created === null) return failDelivery("immutable_snapshot_conflict", 409);
			} catch {
				return failDelivery("snapshot_write_failed", 502);
			}
		}
	}
	const cleanupVerified = nextControlState === "stopped" && body.cleanupVerified === true && body.zeroResidualVerified === true;
	const nextDataMode = nextControlState === "running" ? "live" : nextControlState === "stopped" && row.data_mode === "live" ? "historical" : row.data_mode;
	if (!env.CONTROL_DB.batch) return failDelivery("callback_atomic_unavailable", 503);
	const stateApply = body.source === "control" ? env.CONTROL_DB.prepare(
		`UPDATE project_state SET control_state=?1, data_mode=?2, workflow_run_id=?3,
		 cleanup_verified=?4, expires_at=CASE WHEN ?1 IN ('starting','running','degraded') THEN expires_at ELSE NULL END,
		 snapshot_key=COALESCE(?5, snapshot_key),
		 snapshot_sha256=COALESCE(?6, snapshot_sha256), updated_at=?7, last_event_at=?7
		 WHERE project_slug=?8 AND control_state=?9 AND operation_id=?10 AND generation=?11
		   AND updated_at=?12 AND COALESCE(last_event_at, updated_at)=?13
		   AND (workflow_run_id IS NULL OR workflow_run_id=?3)
		   AND (snapshot_sha256 IS NULL OR ?6 IS NULL OR snapshot_sha256=?6)`,
	).bind(nextControlState, nextDataMode, body.workflowRunId, cleanupVerified ? 1 : 0, snapshotKey, snapshotDigest, body.occurredAt, projectSlug, row.control_state, body.operationId, body.generation, row.updated_at, previousEventAt) : env.CONTROL_DB.prepare(
		`UPDATE project_state SET control_state=?1, data_mode=?2, generation=?3,
		 operation_id=?4, workflow_run_id=?5, cleanup_verified=?6, expires_at=NULL,
		 snapshot_key=COALESCE(?7, snapshot_key), snapshot_sha256=COALESCE(?8, snapshot_sha256),
		 updated_at=?9, last_event_at=?9
		 WHERE project_slug=?10 AND generation<=?3 AND updated_at=?11
		 AND COALESCE(last_event_at, updated_at)=?12`,
	).bind(nextControlState, nextDataMode, body.generation, body.operationId, body.workflowRunId, cleanupVerified ? 1 : 0, snapshotKey, snapshotDigest, body.occurredAt, projectSlug, row.updated_at, previousEventAt);
	const deliveryFinalize = env.CONTROL_DB.prepare(
		"UPDATE callback_deliveries SET status='applied', applied_at=?1 WHERE delivery_id=?2 AND body_sha256=?3 AND status='processing'",
	).bind(body.occurredAt, deliveryId, bodyDigest);
	const applyGuard = env.CONTROL_DB.prepare(
		`INSERT INTO control_batch_guards (operation_id, valid)
		 SELECT ?1, CASE WHEN
		 EXISTS (SELECT 1 FROM project_state WHERE project_slug=?2 AND control_state=?3
		   AND operation_id=?4 AND generation=?5 AND workflow_run_id=?6
		   AND updated_at=?7 AND last_event_at=?7)
		 AND EXISTS (SELECT 1 FROM callback_deliveries WHERE delivery_id=?8
		   AND body_sha256=?9 AND status='applied' AND applied_at=?7)
		 THEN 1 ELSE 0 END`,
	).bind(`callback:${deliveryId}`, projectSlug, nextControlState, body.operationId, body.generation, body.workflowRunId, body.occurredAt, deliveryId, bodyDigest);
	let applyResults: D1RunResultLike[];
	try {
		applyResults = await env.CONTROL_DB.batch([stateApply, deliveryFinalize, applyGuard]);
	} catch {
		return failDelivery("callback_delivery_finalize_conflict", 409);
	}
	if (applyResults.length !== 3 || applyResults.some((result) => result.meta?.changes !== 1)) {
		return failDelivery("callback_delivery_finalize_conflict", 409);
	}
	return json({ applied: true, controlState: nextControlState });
};

export const reconcileExpiredControls = async (env: WorkerEnv) => {
	if (!env.CONTROL_DB.batch) return;
	const statement = env.CONTROL_DB.prepare(
		"SELECT * FROM project_state WHERE expires_at IS NOT NULL AND expires_at <= ?1 AND control_state IN ('running','degraded')",
	).bind(new Date().toISOString());
	if (!statement.all) return;
	const { results } = await statement.all<StateRow>();
	for (const row of results) {
		if (!isCanonicalIso(row.expires_at)) continue;
		const project = getRegisteredProject(row.project_slug);
		if (!project) continue;
		const operationId = crypto.randomUUID();
		const generation = row.generation ?? 0;
		const requestedAt = new Date().toISOString();
		const update = env.CONTROL_DB.prepare(
			`UPDATE project_state SET control_state='stopping', operation_id=?1,
			 generation=?2, idempotency_key=?3, updated_at=?4
			 WHERE project_slug=?5 AND generation=?6 AND control_state=?7 AND expires_at<=?4`,
		).bind(operationId, generation, `ttl:${row.generation}`, requestedAt, row.project_slug, row.generation, row.control_state);
		const insert = env.CONTROL_DB.prepare(
			`INSERT INTO operations (operation_id, project_slug, action, idempotency_key,
			 generation, actor_subject_hash, estimated_cost_usd, requested_at)
			 SELECT ?1, ?2, 'stop', ?3, ?4, ?5, 0.20, ?6
			 WHERE EXISTS (SELECT 1 FROM project_state WHERE project_slug=?2
			 AND operation_id=?1 AND generation=?4 AND control_state='stopping')`,
		).bind(operationId, row.project_slug, `ttl:${row.generation}`, generation, await sha256("system:ttl"), requestedAt);
		const guard = env.CONTROL_DB.prepare(
			`INSERT INTO control_batch_guards (operation_id, valid)
			 SELECT ?1, CASE WHEN
			 EXISTS (SELECT 1 FROM project_state WHERE project_slug=?2 AND operation_id=?1 AND generation=?3 AND control_state='stopping')
			 AND EXISTS (SELECT 1 FROM operations WHERE operation_id=?1 AND project_slug=?2 AND generation=?3 AND action='stop')
			 THEN 1 ELSE 0 END`,
		).bind(operationId, row.project_slug, generation);
		let results: D1RunResultLike[];
		try {
			results = await env.CONTROL_DB.batch([update, insert, guard]);
		} catch {
			continue;
		}
		if (results.length !== 3 || results.some((result) => result.meta?.changes !== 1)) continue;
		try {
			await dispatchFixedWorkflow(
				env,
				project,
				"stop",
				operationId,
				generation,
				row.expires_at,
			);
		} catch {
			await env.CONTROL_DB.prepare(
				"UPDATE project_state SET control_state='cleanup_required', cleanup_verified=0, expires_at=NULL WHERE project_slug=?1",
			)
				.bind(row.project_slug)
				.run();
		}
	}
};

export const handleRequest = async (request: Request, env: WorkerEnv) => {
	const url = new URL(request.url);
	if (request.method === "GET" && url.pathname === "/api/performance/status") {
		return publicStatus(url, env);
	}
	if (request.method === "GET" && url.pathname === "/api/performance/snapshot") {
		return publicSnapshot(request, url, env);
	}
	if (request.method === "POST" && url.pathname === "/api/performance/control/callback") {
		return secureWorkflowCallback(request, env);
	}
	if (request.method === "POST" && url.pathname === "/api/performance/control/session") {
		return createSession(request, url, env);
	}
	if (request.method === "POST" && url.pathname === "/api/performance/control/start") {
		return batchedControlMutation(request, url, env, "start");
	}
	if (request.method === "POST" && url.pathname === "/api/performance/control/stop") {
		return batchedControlMutation(request, url, env, "stop");
	}
	return json({ error: "not_found" }, { status: 404 });
};
