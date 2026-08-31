import { createHash, createHmac, generateKeyPairSync, sign } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
	handleRequest,
	reconcileExpiredControls,
	type D1PreparedStatementLike,
	type WorkerEnv,
} from "../worker";

class Statement {
	constructor(
		private readonly row: unknown,
		private readonly runResult: unknown = { success: true, meta: { changes: 1 } },
	) {}
	bind(..._values: unknown[]) {
		return this;
	}
	async first<T>() {
		return this.row as T | null;
	}
	async run<T>() {
		return this.runResult as T;
	}
}

const env = (options?: {
	row?: unknown;
	objects?: Record<string, string>;
	prepare?: (query: string) => D1PreparedStatementLike;
	putOptions?: unknown[];
	putResult?: unknown;
}): WorkerEnv => ({
	CONTROL_ENABLED: "true",
	CONTROL_ORIGIN: "https://control.example",
	TOTP_SECRET: "JBSWY3DPEHPK3PXP",
	GITHUB_APP_ID: "12345",
	GITHUB_APP_INSTALLATION_ID: "67890",
	GITHUB_APP_PRIVATE_KEY: keyPair.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
	CALLBACK_HMAC_SECRET: "callback-secret",
	CONTROL_DB: {
		prepare: options?.prepare ?? (() => new Statement(options?.row ?? null)),
		batch: async (statements) => Promise.all(statements.map((statement) => statement.run())),
	},
	SNAPSHOTS: {
		get: async (key) => {
			const value = options?.objects?.[key];
			return value === undefined ? null : { text: async () => value };
		},
		put: async (key, value, putOptions?: unknown) => {
			options?.putOptions?.push(putOptions);
			if (options?.objects) options.objects[key] = String(value);
			return options?.putResult ?? { key };
		},
	},
});

const keyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicJwk = keyPair.publicKey.export({ format: "jwk" });
const accessToken = (overrides: Record<string, unknown> = {}) => {
	const header = Buffer.from(
		JSON.stringify({ alg: "RS256", kid: "access-key-1", typ: "JWT" }),
	).toString("base64url");
	const payload = Buffer.from(
		JSON.stringify({
			iss: "https://team.cloudflareaccess.com",
			aud: ["access-audience"],
			exp: Math.floor(Date.now() / 1000) + 300,
			nbf: Math.floor(Date.now() / 1000) - 5,
			type: "app",
			sub: "operator-123",
			email: "operator@example.com",
			...overrides,
		}),
	).toString("base64url");
	const signature = sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), keyPair.privateKey).toString("base64url");
	return `${header}.${payload}.${signature}`;
};

const decodeBase32 = (value: string) => {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	let bits = "";
	for (const character of value) bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
	return Buffer.from(Array.from({ length: Math.floor(bits.length / 8) }, (_, index) => Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2)));
};

const currentTotp = () => {
	const counter = BigInt(Math.floor(Date.now() / 30_000));
	const message = Buffer.alloc(8);
	message.writeBigUInt64BE(counter);
	const digest = createHmac("sha1", decodeBase32("JBSWY3DPEHPK3PXP")).update(message).digest();
	const offset = digest[digest.length - 1] & 0x0f;
	const binary = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
	return String(binary % 1_000_000).padStart(6, "0");
};

const controlRequest = (
	path: string,
	init: RequestInit = {},
) =>
	new Request(`https://control.example${path}`, {
		...init,
		method: "POST",
		headers: {
			origin: "https://control.example",
			"x-control-totp": currentTotp(),
			"cf-access-jwt-assertion": accessToken(),
			...init.headers,
		},
	});

afterEach(() => vi.unstubAllGlobals());

describe("performance control worker public reads", () => {
	it("rejects unknown projects instead of exposing an open proxy", async () => {
		const response = await handleRequest(
			new Request("https://control.example/api/performance/status?project=unknown"),
			env(),
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: "unknown_project" });
	});

	it("fails closed when D1 has no authoritative bootstrap state", async () => {
		const response = await handleRequest(
			new Request(
				"https://control.example/api/performance/status?project=performance-observability-control",
			),
			env(),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			projectSlug: "performance-observability-control",
			controlState: "unknown",
			dataMode: "unavailable",
			cleanupVerified: false,
			snapshotAvailable: false,
			metrics: [],
		});
	});

	it("keeps digest-only migrated snapshots unavailable to public readers", async () => {
		const legacyDigest = "a".repeat(64);
		const migratedRow = { project_slug: "performance-observability-control", control_state: "unknown", data_mode: "unavailable", generation: 0, cleanup_verified: 0, snapshot_sha256: null, snapshot_key: null, legacy_snapshot_sha256: legacyDigest, estimated_cost_usd: 0.20, updated_at: "2026-08-26T00:00:00.000Z" };
		const migratedEnv = env({ row: migratedRow });
		const status = await handleRequest(new Request("https://control.example/api/performance/status?project=performance-observability-control"), migratedEnv);
		expect(await status.json()).toMatchObject({ controlState: "unknown", dataMode: "unavailable", snapshotAvailable: false });
		const snapshot = await handleRequest(new Request("https://control.example/api/performance/snapshot?project=performance-observability-control"), migratedEnv);
		expect(snapshot.status).toBe(404);
	});

	it("serves only a verified immutable latest snapshot and supports ETag", async () => {
		const snapshot = JSON.stringify({
			schemaVersion: 1,
			projectSlug: "performance-observability-control",
			captureId: "capture-20260814T100000Z",
			capturedAt: "2026-08-14T10:00:00.000Z",
			kind: "synthetic-closed-loop",
			window: {
				from: "2026-08-14T09:55:00.000Z",
				to: "2026-08-14T10:00:00.000Z",
			},
			repository: "Tiancheng-Xu/course-homework",
			commitSha: "0123456789abcdef0123456789abcdef01234567",
			workflowRunId: "run-101",
			sdkVersion: "0.1.0",
			cleanerVersion: "0.1.0",
			percentileMethod: "nearest-rank",
			sampleRate: 1,
			filters: { environment: "preview", route: "/performance" },
			metrics: [
				{
					name: "LCP",
					unit: "ms",
					page: "/performance",
					route: "/performance",
					sampleCount: 4,
					p50: 900,
					p75: 1100,
					p95: 1400,
					errorCount: 0,
				},
			],
		});
		const digest = createHash("sha256").update(snapshot).digest("hex");
		const captureKey = `performance/performance-observability-control/operations/op-public/generations/1/${digest}.json`;
		const objects = {
			"performance/performance-observability-control/latest.json": JSON.stringify({
				key: captureKey,
				sha256: digest,
			}),
			[captureKey]: snapshot,
		};
		const pointerRow = { snapshot_key: captureKey, snapshot_sha256: digest };

		const response = await handleRequest(
			new Request(
				"https://control.example/api/performance/snapshot?project=performance-observability-control",
			),
			env({ objects, row: pointerRow }),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("etag")).toBe(`"${digest}"`);
		expect(await response.json()).toMatchObject({
			projectSlug: "performance-observability-control",
			captureId: "capture-20260814T100000Z",
		});

		const cached = await handleRequest(
			new Request(
				"https://control.example/api/performance/snapshot?project=performance-observability-control",
				{ headers: { "if-none-match": `"${digest}"` } },
			),
			env({ objects, row: pointerRow }),
		);
		expect(cached.status).toBe(304);
	});
});

describe("performance control worker writes", () => {
	it("keeps public reads open but rejects control sessions without a TOTP code", async () => {
		const response = await handleRequest(
			new Request(
				"https://control.example/api/performance/control/session?project=performance-observability-control",
				{ method: "POST", headers: { origin: "https://control.example" } },
			),
			env(),
		);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "totp_required" });
	});

	it("rejects a malformed or incorrect TOTP code", async () => {
		for (const code of ["12345", "abcdef", "000000"]) {
			const response = await handleRequest(
				controlRequest("/api/performance/control/session?project=performance-observability-control", {
					headers: { "x-control-totp": code },
				}),
				env(),
			);
			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ error: "totp_invalid" });
		}
	});

	it("issues one short-lived nonce only after valid TOTP authentication", async () => {
		const response = await handleRequest(
			controlRequest("/api/performance/control/session?project=performance-observability-control"),
			env(),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			mfaVerified: true,
			maximumRuntimeMinutes: 45,
			estimatedCostUsd: 0.2,
		});
	});

	it("allows independent trusted devices to share TOTP while issuing distinct nonces", async () => {
		const [firstResponse, secondResponse] = await Promise.all([
			handleRequest(
				controlRequest("/api/performance/control/session?project=performance-observability-control"),
				env(),
			),
			handleRequest(
				controlRequest("/api/performance/control/session?project=performance-observability-control"),
				env(),
			),
		]);

		expect(firstResponse.status).toBe(200);
		expect(secondResponse.status).toBe(200);
		const first = await firstResponse.json() as { mfaVerified: boolean; nonce: string };
		const second = await secondResponse.json() as { mfaVerified: boolean; nonce: string };
		expect(first.mfaVerified).toBe(true);
		expect(second.mfaVerified).toBe(true);
		expect(first.nonce).not.toBe(second.nonce);
	});

	it("rejects cross-origin mutation and dispatches only the fixed BabySteps workflow once", async () => {
		const queries: string[] = [];
		const prepare = (query: string) => {
			queries.push(query);
			if (query.includes("FROM control_nonces")) return new Statement({ nonce: "nonce-1", consumed_at: null, expires_at: "2099-01-01T00:00:00.000Z" });
			if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "stopped", data_mode: "historical", generation: 1, cleanup_verified: 1, updated_at: "2026-08-26T00:00:00.000Z" });
			return new Statement(null);
		};
		const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			const url = String(input);
			if (url.endsWith("/cdn-cgi/access/certs")) return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "access-key-1", alg: "RS256", use: "sig" }] }));
			if (url.includes("/app/installations/67890/access_tokens")) {
				expect(JSON.parse(String(init?.body))).toEqual({ repositories: ["babysteps"], permissions: { actions: "write", metadata: "read" } });
				return new Response(JSON.stringify({ token: "installation-token" }));
			}
			if (url.includes("/repos/Tiancheng-Xu/babysteps/actions/workflows/aws-performance-control.yml/dispatches")) {
				const dispatch = JSON.parse(String(init?.body));
				expect(Object.keys(dispatch.inputs)).toEqual(["action", "operation_id", "generation", "expires_at", "estimated_cost_usd"]);
				expect(dispatch).toMatchObject({ ref: "main", inputs: { action: "start", generation: "2", estimated_cost_usd: "0.20" } });
				expect(dispatch.inputs.operation_id).toMatch(/^[0-9a-f-]{36}$/);
				expect(Number.isFinite(Date.parse(dispatch.inputs.expires_at))).toBe(true);
				return new Response(null, { status: 204 });
			}
			throw new Error(`unexpected fetch ${url}`);
		});
		vi.stubGlobal("fetch", fetchMock);

		const crossOrigin = await handleRequest(
			controlRequest("/api/performance/control/start?project=performance-observability-control", {
				headers: { origin: "https://evil.example", "cf-access-jwt-assertion": accessToken(), "x-control-nonce": "nonce-1", "idempotency-key": "start-0001" },
			}),
			env({ prepare }),
		);
		expect(crossOrigin.status).toBe(403);

		const response = await handleRequest(
			controlRequest("/api/performance/control/start?project=performance-observability-control", {
				headers: { origin: "https://control.example", "cf-access-jwt-assertion": accessToken(), "x-control-nonce": "nonce-1", "idempotency-key": "start-0001" },
			}),
			env({ prepare }),
		);
		expect(response.status).toBe(202);
		expect(fetchMock.mock.calls.some(([url]) => String(url).includes("Tiancheng-Xu/babysteps/actions/workflows/aws-performance-control.yml"))).toBe(true);
		expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/app/installations/67890/access_tokens"))).toBe(true);
		expect(fetchMock.mock.calls.some(([url]) => /course-homework|performance-start|performance-stop/.test(String(url)))).toBe(false);
		expect(queries.some((query) => query.includes("consumed_at"))).toBe(true);
		expect(queries.some((query) => query.includes("consumed_at IS NULL") && query.includes("expires_at >") && query.includes("actor_subject_hash") && query.includes("project_slug"))).toBe(true);
		expect(queries.some((query) => query.includes("generation") && query.includes("control_state") && query.includes("WHERE project_slug"))).toBe(true);
	});

	it("refuses start when project state is missing instead of self-bootstrapping verified cleanup", async () => {
		vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
			const url = String(input);
			if (url.endsWith("/cdn-cgi/access/certs")) return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "access-key-1", alg: "RS256", use: "sig" }] }));
			throw new Error(`unexpected fetch ${url}`);
		}));
		const response = await handleRequest(
			controlRequest("/api/performance/control/start?project=performance-observability-control", { headers: { origin: "https://control.example", "cf-access-jwt-assertion": accessToken(), "x-control-nonce": "nonce-missing-state", "idempotency-key": "missing-state-1" } }),
			env({ prepare: (query) => query.includes("UPDATE control_nonces") ? new Statement(null, { success: true, meta: { changes: 1 } }) : new Statement(null) }),
		);
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: "state_not_bootstrapped" });
	});

	it("returns a controlled failure when D1 state lookup throws", async () => {
		vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
			const url = String(input);
			if (url.endsWith("/cdn-cgi/access/certs")) return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "access-key-1", alg: "RS256", use: "sig" }] }));
			throw new Error(`unexpected fetch ${url}`);
		}));
		const response = await handleRequest(
			controlRequest("/api/performance/control/start?project=performance-observability-control", { headers: { origin: "https://control.example", "cf-access-jwt-assertion": accessToken(), "x-control-nonce": "nonce-d1-error", "idempotency-key": "d1-error-state-1" } }),
			env({ prepare: (query) => {
				if (query.includes("UPDATE control_nonces")) return new Statement(null, { success: true, meta: { changes: 1 } });
				throw new Error("d1_unavailable");
			} }),
		);
		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: "state_unavailable" });
	});

	it("rolls back to cleanup_required when GitHub installation token exchange fails", async () => {
		const queries: string[] = [];
		vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
			const url = String(input);
			if (url.endsWith("/cdn-cgi/access/certs")) return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "access-key-1", alg: "RS256", use: "sig" }] }));
			if (url.includes("/app/installations/67890/access_tokens")) return new Response(JSON.stringify({ message: "denied" }), { status: 403 });
			throw new Error(`unexpected fetch ${url}`);
		}));
		const response = await handleRequest(
			controlRequest("/api/performance/control/start?project=performance-observability-control", { headers: { origin: "https://control.example", "cf-access-jwt-assertion": accessToken(), "x-control-nonce": "nonce-1", "idempotency-key": "exchange-failure-1" } }),
			env({ prepare: (query) => {
				queries.push(query);
				if (query.includes("FROM control_nonces")) return new Statement({ nonce: "nonce-1", consumed_at: null, expires_at: "2099-01-01T00:00:00.000Z" });
				if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "stopped", data_mode: "historical", generation: 1, cleanup_verified: 1, updated_at: "2026-08-26T00:00:00.000Z" });
				return new Statement(null, { success: true, meta: { changes: 1 } });
			} }),
		);
		expect(response.status).toBe(502);
		expect(queries.some((query) => query.includes("cleanup_required"))).toBe(true);
	});

	it("allows only one dispatch when two requests race with the same nonce and generation", async () => {
		let nonceConsumed = false;
		let stateClaimed = false;
		let dispatches = 0;
		const prepare = (query: string) => {
			let values: unknown[] = [];
			return {
				bind(...bound: unknown[]) { values = bound; return this; },
				async first<T>() {
					if (query.includes("FROM project_state")) return { project_slug: "performance-observability-control", control_state: "stopped", data_mode: "historical", generation: 7, cleanup_verified: 1, updated_at: "2026-08-26T00:00:00.000Z" } as T;
					return null;
				},
				async run<T>() {
					if (query.includes("UPDATE control_nonces")) { const changes = nonceConsumed ? 0 : 1; nonceConsumed = true; return { success: true, meta: { changes } } as T; }
					if (query.includes("UPDATE project_state") && query.includes("control_state")) { const changes = stateClaimed ? 0 : 1; stateClaimed = true; return { success: true, meta: { changes } } as T; }
					return { success: true, meta: { changes: 1 }, values } as T;
				},
			};
		};
		vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
			const url = String(input);
			if (url.endsWith("/cdn-cgi/access/certs")) return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "access-key-1", alg: "RS256", use: "sig" }] }));
			if (url.includes("/app/installations/67890/access_tokens")) return new Response(JSON.stringify({ token: "short-lived-token" }));
			if (url.includes("/dispatches")) { dispatches += 1; return new Response(null, { status: 204 }); }
			throw new Error(`unexpected fetch ${url}`);
		}));
		const request = () => controlRequest("/api/performance/control/start?project=performance-observability-control", { headers: { origin: "https://control.example", "cf-access-jwt-assertion": accessToken(), "x-control-nonce": "race-nonce", "idempotency-key": "race-operation-1" } });
		const responses = await Promise.all([handleRequest(request(), env({ prepare })), handleRequest(request(), env({ prepare }))]);
		expect(responses.map((response) => response.status).sort()).toEqual([202, 409]);
		expect(dispatches).toBe(1);
	});

	it("rolls back nonce, state, and operation when the control batch fails", async () => {
		let dispatches = 0;
		const database = {
			prepare(query: string) {
				if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "stopped", data_mode: "historical", generation: 4, cleanup_verified: 1, updated_at: "2026-08-26T00:00:00.000Z" });
				return new Statement(null);
			},
			async batch() { throw new Error("batch_rolled_back"); },
		};
		vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
			const url = String(input);
			if (url.endsWith("/cdn-cgi/access/certs")) return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "access-key-1", alg: "RS256", use: "sig" }] }));
			if (url.includes("/dispatches")) dispatches += 1;
			throw new Error(`unexpected fetch ${url}`);
		}));
		const response = await handleRequest(controlRequest("/api/performance/control/start?project=performance-observability-control", { headers: { origin: "https://control.example", "cf-access-jwt-assertion": accessToken(), "x-control-nonce": "batch-nonce", "idempotency-key": "batch-rollback-1" } }), { ...env(), CONTROL_DB: database });
		expect(response.status).toBe(409);
		expect(dispatches).toBe(0);
	});

	it("reuses the active expiry for manual stop and fails closed when it is missing", async () => {
		const activeExpiry = "2026-08-26T13:00:00.000Z";
		const dispatches: Array<Record<string, string>> = [];
		vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			const url = String(input);
			if (url.endsWith("/cdn-cgi/access/certs")) return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "access-key-1", alg: "RS256", use: "sig" }] }));
			if (url.includes("/access_tokens")) return new Response(JSON.stringify({ token: "manual-stop-token" }));
			if (url.includes("/dispatches")) { dispatches.push(JSON.parse(String(init?.body)).inputs); return new Response(null, { status: 204 }); }
			throw new Error(`unexpected fetch ${url}`);
		}));
		const activeRow = { project_slug: "performance-observability-control", control_state: "running", data_mode: "live", generation: 3, operation_id: "active-op", workflow_run_id: "active-run", cleanup_verified: 0, expires_at: activeExpiry, updated_at: "2026-08-26T12:00:00.000Z" };
		const stop = await handleRequest(controlRequest("/api/performance/control/stop?project=performance-observability-control", { headers: { origin: "https://control.example", "cf-access-jwt-assertion": accessToken(), "x-control-nonce": "manual-stop-nonce", "idempotency-key": "manual-stop-key" } }), env({ row: activeRow }));
		expect(stop.status).toBe(202);
		expect(dispatches).toHaveLength(1);
		expect(dispatches[0]).toMatchObject({ action: "stop", generation: "3", expires_at: activeExpiry, estimated_cost_usd: "0.20" });
		expect(dispatches[0].operation_id).not.toBe("active-op");

		const missingExpiry = await handleRequest(controlRequest("/api/performance/control/stop?project=performance-observability-control", { headers: { origin: "https://control.example", "cf-access-jwt-assertion": accessToken(), "x-control-nonce": "missing-expiry-nonce", "idempotency-key": "missing-expiry-key" } }), env({ row: { ...activeRow, expires_at: null } }));
		expect(missingExpiry.status).toBe(409);
		expect(await missingExpiry.json()).toEqual({ error: "active_expiry_required" });
		expect(dispatches).toHaveLength(1);
	});

	it("restores the persisted operation action on the real HTTP batch path", async () => {
		const queries: string[] = [];
		let batchCalled = false;
		vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
			const url = String(input);
			if (url.endsWith("/cdn-cgi/access/certs")) return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "access-key-1", alg: "RS256", use: "sig" }] }));
			throw new Error(`unexpected fetch ${url}`);
		}));
		const database = {
			prepare(query: string): D1PreparedStatementLike {
				queries.push(query);
				if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "starting", data_mode: "unavailable", generation: 4, operation_id: "persisted-start-op", idempotency_key: "cross-action-key", workflow_run_id: null, cleanup_verified: 0, expires_at: "2026-08-26T13:00:00.000Z", updated_at: "2026-08-26T12:00:00.000Z" });
				if (query.includes("SELECT action FROM operations")) return new Statement({ action: "start" });
				return new Statement(null);
			},
			async batch() { batchCalled = true; return []; },
		};
		const response = await handleRequest(controlRequest("/api/performance/control/stop?project=performance-observability-control", { headers: { origin: "https://control.example", "cf-access-jwt-assertion": accessToken(), "x-control-nonce": "cross-action-nonce", "idempotency-key": "cross-action-key" } }), { ...env(), CONTROL_DB: database });
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: "idempotency_action_conflict" });
		expect(queries.some((query) => query.includes("SELECT action FROM operations"))).toBe(true);
		expect(batchCalled).toBe(false);
	});

	it("authenticates callbacks with HMAC and writes a validated snapshot immutably", async () => {
		const objects: Record<string, string> = {};
		const putOptions: unknown[] = [];
		const snapshot = {
			schemaVersion: 1, projectSlug: "performance-observability-control", captureId: "capture-callback-1", capturedAt: "2026-08-26T10:05:00.000Z", kind: "synthetic-closed-loop", window: { from: "2026-08-26T10:00:00.000Z", to: "2026-08-26T10:05:00.000Z" }, repository: "Tiancheng-Xu/babysteps", commitSha: "0123456789abcdef0123456789abcdef01234567", workflowRunId: "32920000000", sdkVersion: "1.0.0", cleanerVersion: "1.0.0", percentileMethod: "nearest-rank", sampleRate: 1, filters: { environment: "production" }, metrics: [{ name: "LCP", unit: "ms", page: "/performance", route: "/performance", sampleCount: 1, p50: 321, p75: 321, p95: 321, errorCount: 0 }],
		};
		const body = JSON.stringify({ schemaVersion: "1.0", deliveryId: "delivery-1", source: "control", operationId: "op-1", generation: 2, workflowRunId: "32920000000", status: "stopped", cleanupVerified: true, zeroResidualVerified: true, occurredAt: new Date().toISOString(), snapshot });
		const signature = createHmac("sha256", "callback-secret").update(body).digest("hex");
		const callbackRequest = (callbackBody: string, deliveryId = "delivery-1", timestamp = String(Math.floor(Date.now() / 1000))) => new Request("https://baby2b.online/api/performance/control/callback", { method: "POST", headers: { "content-length": String(Buffer.byteLength(callbackBody)), "x-performance-timestamp": timestamp, "x-performance-delivery-id": deliveryId, "x-performance-signature-256": `sha256=${createHmac("sha256", "callback-secret").update(`${timestamp}.${callbackBody}`).digest("hex")}` }, body: callbackBody });
		let reservedDigest: string | null = null;
		let deliveryDigest: string | null = null;
		const callbackEnv = env({ objects, putOptions, prepare: (query) => {
			if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "stopping", data_mode: "live", generation: 2, operation_id: "op-1", workflow_run_id: "32920000000", cleanup_verified: 0, updated_at: new Date(Date.now() - 1_000).toISOString() });
			if (query.includes("UPDATE operations SET snapshot_sha256")) {
				let candidate = "";
				return { bind(value: unknown) { candidate = String(value); return this; }, async first<T>() { return null as T | null; }, async run<T>() { const changes = reservedDigest === null || reservedDigest === candidate ? 1 : 0; if (changes === 1) reservedDigest = candidate; return { success: true, meta: { changes } } as T; } };
			}
			if (query.includes("INSERT INTO callback_deliveries")) {
				let digest = "";
				return { bind(_delivery: unknown, value: unknown) { digest = String(value); return this; }, async first<T>() { return null as T | null; }, async run<T>() { const changes = deliveryDigest === null ? 1 : 0; if (changes === 1) deliveryDigest = digest; return { success: true, meta: { changes } } as T; } };
			}
			if (query.includes("FROM callback_deliveries")) return new Statement(deliveryDigest ? { body_sha256: deliveryDigest } : null);
			return new Statement(null, { success: true, meta: { changes: 1 } });
		} });
		const response = await handleRequest(
			callbackRequest(body),
			callbackEnv,
		);

		expect(response.status).toBe(200);
		expect(putOptions).toContainEqual({ onlyIf: { etagDoesNotMatch: "*" } });
		const snapshotDigest = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
		expect(Object.keys(objects)).toContain(`performance/performance-observability-control/operations/op-1/generations/2/${snapshotDigest}.json`);
		expect((await handleRequest(callbackRequest(body), callbackEnv)).status).toBe(200);
		const conflictingBody = JSON.stringify({ ...JSON.parse(body), snapshot: { ...snapshot, metrics: [{ ...snapshot.metrics[0], p95: 322 }] } });
		expect((await handleRequest(callbackRequest(conflictingBody), callbackEnv)).status).toBe(409);
		expect((await handleRequest(callbackRequest(conflictingBody, "delivery-1"), callbackEnv)).status).toBe(409);
		expect((await handleRequest(callbackRequest(body, "expired-delivery", String(Math.floor(Date.now() / 1000) - 301)), callbackEnv)).status).toBe(401);
	});

	it("rejects non-finite and non-increasing callback event times", async () => {
		const send = async (occurredAt: string, delivery: string) => {
			const body = JSON.stringify({ schemaVersion: "1.0", deliveryId: delivery, source: "control", operationId: "op-time", generation: 5, workflowRunId: "run-time", status: "running", cleanupVerified: false, zeroResidualVerified: false, occurredAt });
			const timestamp = String(Math.floor(Date.now() / 1000));
			return handleRequest(new Request("https://baby2b.online/api/performance/control/callback", { method: "POST", headers: { "content-length": String(body.length), "x-performance-timestamp": timestamp, "x-performance-delivery-id": delivery, "x-performance-signature-256": `sha256=${createHmac("sha256", "callback-secret").update(`${timestamp}.${body}`).digest("hex")}` }, body }), env({ prepare: (query) => {
				if (query.includes("INSERT INTO callback_deliveries")) return new Statement(null, { success: true, meta: { changes: 1 } });
				if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "starting", data_mode: "unavailable", generation: 5, operation_id: "op-time", workflow_run_id: "run-time", cleanup_verified: 0, last_event_at: "2026-08-26T10:00:00.000Z", updated_at: "2026-08-26T10:00:00.000Z" });
				return new Statement(null);
			} }));
		};
		expect((await send("not-a-time", "delivery-bad-time")).status).toBe(400);
		expect((await send("2026-08-26T10:00:00.000Z", "delivery-equal-time")).status).toBe(409);
	});

	it("rejects late callback transitions that would overwrite a terminal state", async () => {
		const body = JSON.stringify({ schemaVersion: "1.0", deliveryId: "late-delivery", source: "control", operationId: "op-final", generation: 3, workflowRunId: "run-final", status: "running", cleanupVerified: false, zeroResidualVerified: false, occurredAt: new Date().toISOString() });
		const timestamp = String(Math.floor(Date.now() / 1000));
		const response = await handleRequest(
			new Request("https://baby2b.online/api/performance/control/callback", { method: "POST", headers: { "content-length": String(body.length), "x-performance-timestamp": timestamp, "x-performance-delivery-id": "late-delivery", "x-performance-signature-256": `sha256=${createHmac("sha256", "callback-secret").update(`${timestamp}.${body}`).digest("hex")}` }, body }),
			env({ prepare: (query) => {
				if (query.includes("INSERT INTO callback_deliveries")) return new Statement(null, { success: true, meta: { changes: 1 } });
				if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "stopped", data_mode: "historical", generation: 3, operation_id: "op-final", workflow_run_id: "run-final", cleanup_verified: 1, updated_at: new Date().toISOString() });
				return new Statement(null);
			} }),
		);
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: "invalid_callback_transition" });
	});

	it("reclaims a failed delivery lease and applies the same body on retry", async () => {
		const occurredAt = new Date().toISOString();
		const body = JSON.stringify({ schemaVersion: "1.0", deliveryId: "delivery-retry", source: "control", operationId: "op-retry", generation: 6, workflowRunId: "run-retry", status: "running", cleanupVerified: false, zeroResidualVerified: false, occurredAt });
		const bodyDigest = createHash("sha256").update(body).digest("hex");
		const timestamp = String(Math.floor(Date.now() / 1000));
		const request = () => new Request("https://baby2b.online/api/performance/control/callback", { method: "POST", headers: { "content-length": String(body.length), "x-performance-timestamp": timestamp, "x-performance-delivery-id": "delivery-retry", "x-performance-signature-256": `sha256=${createHmac("sha256", "callback-secret").update(`${timestamp}.${body}`).digest("hex")}` }, body });
		let delivery: { status: string; body_sha256: string; claimed_at: string; attempts: number } | null = null;
		let finalAttempts = 0;
		const retryEnv = env({ prepare: (query) => {
			if (query.includes("INSERT INTO callback_deliveries")) return new Statement(null, { success: true, meta: { changes: delivery ? 0 : (delivery = { status: "processing", body_sha256: bodyDigest, claimed_at: occurredAt, attempts: 1 }, 1) } });
			if (query.includes("FROM callback_deliveries")) return new Statement(delivery);
			if (query.includes("SET status='processing'")) { if (delivery) { delivery.status = "processing"; delivery.attempts += 1; } return new Statement(null, { success: true, meta: { changes: 1 } }); }
			if (query.includes("SET status='failed'")) { if (delivery) delivery.status = "failed"; return new Statement(null, { success: true, meta: { changes: 1 } }); }
			if (query.includes("SET status='applied'")) { if (delivery) delivery.status = "applied"; return new Statement(null, { success: true, meta: { changes: 1 } }); }
			if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "starting", data_mode: "unavailable", generation: 6, operation_id: "op-retry", workflow_run_id: "run-retry", cleanup_verified: 0, last_event_at: new Date(Date.now() - 1_000).toISOString(), updated_at: new Date(Date.now() - 1_000).toISOString() });
			if (query.includes("UPDATE project_state SET")) { finalAttempts += 1; return new Statement(null, { success: true, meta: { changes: finalAttempts === 1 ? 0 : 1 } }); }
			return new Statement(null, { success: true, meta: { changes: 1 } });
		} });
		expect((await handleRequest(request(), retryEnv)).status).toBe(409);
		expect(delivery).toMatchObject({ status: "failed" });
		expect((await handleRequest(request(), retryEnv)).status).toBe(200);
		expect(delivery).toMatchObject({ status: "applied", attempts: 2 });
	});

	it("rolls back callback state when the atomic finalize batch fails between steps and retries", async () => {
		const occurredAt = new Date().toISOString();
		const body = JSON.stringify({ schemaVersion: "1.0", deliveryId: "delivery-atomic-retry", source: "control", operationId: "op-atomic-retry", generation: 8, workflowRunId: "run-atomic-retry", status: "running", cleanupVerified: false, zeroResidualVerified: false, occurredAt });
		const bodyDigest = createHash("sha256").update(body).digest("hex");
		const timestamp = String(Math.floor(Date.now() / 1000));
		const request = () => new Request("https://baby2b.online/api/performance/control/callback", { method: "POST", headers: { "content-length": String(body.length), "x-performance-timestamp": timestamp, "x-performance-delivery-id": "delivery-atomic-retry", "x-performance-signature-256": `sha256=${createHmac("sha256", "callback-secret").update(`${timestamp}.${body}`).digest("hex")}` }, body });
		let delivery: { status: string; body_sha256: string; claimed_at: string; attempts: number } | null = null;
		let stateApplied = false;
		let batchAttempts = 0;
		const atomicEnv = env({ prepare: (query) => {
			if (query.includes("INSERT INTO callback_deliveries")) return new Statement(null, { success: true, meta: { changes: delivery ? 0 : (delivery = { status: "processing", body_sha256: bodyDigest, claimed_at: occurredAt, attempts: 1 }, 1) } });
			if (query.includes("FROM callback_deliveries")) return new Statement(delivery);
			if (query.includes("SET status='processing'")) return { bind() { return this; }, async first<T>() { return null as T | null; }, async run<T>() { if (delivery) { delivery.status = "processing"; delivery.attempts += 1; } return { success: true, meta: { changes: 1 } } as T; } };
			if (query.includes("SET status='failed'")) return { bind() { return this; }, async first<T>() { return null as T | null; }, async run<T>() { if (delivery) delivery.status = "failed"; return { success: true, meta: { changes: 1 } } as T; } };
			if (query.includes("SET status='applied'")) return { bind() { return this; }, async first<T>() { return null as T | null; }, async run<T>() { if (delivery) delivery.status = "applied"; return { success: true, meta: { changes: 1 } } as T; } };
			if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "starting", data_mode: "unavailable", generation: 8, operation_id: "op-atomic-retry", workflow_run_id: "run-atomic-retry", cleanup_verified: 0, last_event_at: new Date(Date.now() - 1_000).toISOString(), updated_at: new Date(Date.now() - 1_000).toISOString() });
			if (query.includes("UPDATE project_state SET")) return { bind() { return this; }, async first<T>() { return null as T | null; }, async run<T>() { stateApplied = true; return { success: true, meta: { changes: 1 } } as T; } };
			return new Statement(null, { success: true, meta: { changes: 1 } });
		} });
		atomicEnv.CONTROL_DB.batch = async (statements) => {
			batchAttempts += 1;
			if (batchAttempts === 1) { await statements[0].run(); stateApplied = false; throw new Error("transaction_interrupted"); }
			return Promise.all(statements.map((statement) => statement.run()));
		};
		expect((await handleRequest(request(), atomicEnv)).status).toBe(409);
		expect(stateApplied).toBe(false);
		expect(delivery).toMatchObject({ status: "failed" });
		expect((await handleRequest(request(), atomicEnv)).status).toBe(200);
		expect(stateApplied).toBe(true);
		expect(delivery).toMatchObject({ status: "applied", attempts: 2 });
	});

	it("rolls back bootstrap when delivery finalize fails and retries atomically", async () => {
		const occurredAt = new Date().toISOString();
		const body = JSON.stringify({
			schemaVersion: "1.0",
			deliveryId: "delivery-bootstrap-retry",
			source: "babysteps-performance-control-bootstrap-v1",
			operation: "bootstrap-stopped-state",
			operationId: "bootstrap-babysteps-stopped-retry-33333333333",
			generation: 1,
			workflowRunId: "33333333333",
			status: "stopped",
			cleanupVerified: true,
			zeroResidualVerified: true,
			bootstrapOnly: true,
			occurredAt,
			proof: {
				authority: "github-actions-artifact+aws-zero-residue-readback",
				workflowRunId: "33279132965",
				artifactId: "9722636468",
				evidenceSha256: "a".repeat(64),
				schemaAbsenceVerified: true,
				cloudFormationStackAbsent: true,
				remainingProjectResources: 0,
				sharedFoundationProtected: true,
			},
		});
		const bodyDigest = createHash("sha256").update(body).digest("hex");
		const timestamp = String(Math.floor(Date.now() / 1000));
		const request = () => new Request("https://baby2b.online/api/performance/control/callback", { method: "POST", headers: { "content-length": String(body.length), "x-performance-timestamp": timestamp, "x-performance-delivery-id": "delivery-bootstrap-retry", "x-performance-signature-256": `sha256=${createHmac("sha256", "callback-secret").update(`${timestamp}.${body}`).digest("hex")}` }, body });
		let delivery: { status: string; body_sha256: string; claimed_at: string; attempts: number } | null = null;
		let bootstrapped = false;
		let finalizeAttempts = 0;
		const bootstrapEnv = env({ prepare: (query) => {
			if (query.includes("INSERT INTO callback_deliveries")) return new Statement(null, { success: true, meta: { changes: delivery ? 0 : (delivery = { status: "processing", body_sha256: bodyDigest, claimed_at: occurredAt, attempts: 1 }, 1) } });
			if (query.includes("FROM callback_deliveries")) return new Statement(delivery);
			if (query.includes("SET status='processing'")) return { bind() { return this; }, async first<T>() { return null as T | null; }, async run<T>() { if (delivery) { delivery.status = "processing"; delivery.attempts += 1; } return { success: true, meta: { changes: 1 } } as T; } };
			if (query.includes("SET status='failed'")) return { bind() { return this; }, async first<T>() { return null as T | null; }, async run<T>() { if (delivery) delivery.status = "failed"; return { success: true, meta: { changes: 1 } } as T; } };
			if (query.includes("FROM project_state")) return new Statement(bootstrapped ? { project_slug: "performance-observability-control", control_state: "stopped", data_mode: "unavailable", generation: 1, operation_id: "bootstrap-babysteps-stopped-retry-33333333333", workflow_run_id: "33333333333", cleanup_verified: 1, updated_at: occurredAt, last_event_at: occurredAt } : null);
			if (query.includes("INSERT INTO project_state")) return { bind() { return this; }, async first<T>() { return null as T | null; }, async run<T>() { bootstrapped = true; return { success: true, meta: { changes: 1 } } as T; } };
			if (query.includes("SET status='applied'")) return { bind() { return this; }, async first<T>() { return null as T | null; }, async run<T>() { finalizeAttempts += 1; const changes = finalizeAttempts === 1 ? 0 : 1; if (changes && delivery) delivery.status = "applied"; return { success: true, meta: { changes } } as T; } };
			return new Statement(null, { success: true, meta: { changes: 1 } });
		} });
		bootstrapEnv.CONTROL_DB.batch = async (statements) => {
			const results = [];
			for (const statement of statements) results.push(await statement.run());
			if (results.some((result) => result.meta?.changes !== 1)) { bootstrapped = false; throw new Error("finalize_guard_failed"); }
			return results;
		};
		expect((await handleRequest(request(), bootstrapEnv)).status).toBe(409);
		expect(bootstrapped).toBe(false);
		expect(delivery).toMatchObject({ status: "failed" });
		expect((await handleRequest(request(), bootstrapEnv)).status).toBe(200);
		expect(bootstrapped).toBe(true);
		expect(delivery).toMatchObject({ status: "applied", attempts: 2 });
	});

	it("rejects a dedicated bootstrap when the D1 project row already exists", async () => {
		const occurredAt = new Date().toISOString();
		const body = JSON.stringify({
			schemaVersion: "1.0",
			deliveryId: "delivery-bootstrap-existing",
			source: "babysteps-performance-control-bootstrap-v1",
			operation: "bootstrap-stopped-state",
			operationId: "bootstrap-babysteps-stopped-existing-33333333333",
			generation: 1,
			workflowRunId: "33333333333",
			status: "stopped",
			cleanupVerified: true,
			zeroResidualVerified: true,
			bootstrapOnly: true,
			occurredAt,
			proof: {
				authority: "github-actions-artifact+aws-zero-residue-readback",
				workflowRunId: "33279132965",
				artifactId: "9722636468",
				evidenceSha256: "a".repeat(64),
				schemaAbsenceVerified: true,
				cloudFormationStackAbsent: true,
				remainingProjectResources: 0,
				sharedFoundationProtected: true,
			},
		});
		const timestamp = String(Math.floor(Date.now() / 1000));
		const response = await handleRequest(
			new Request("https://baby2b.online/api/performance/control/callback", {
				method: "POST",
				headers: {
					"content-length": String(Buffer.byteLength(body)),
					"x-performance-timestamp": timestamp,
					"x-performance-delivery-id": "delivery-bootstrap-existing",
					"x-performance-signature-256": `sha256=${createHmac("sha256", "callback-secret").update(`${timestamp}.${body}`).digest("hex")}`,
				},
				body,
			}),
			env({
				prepare: (query) => {
					if (query.includes("FROM project_state")) {
						return new Statement({
							project_slug: "performance-observability-control",
							control_state: "stopped",
							data_mode: "unavailable",
							generation: 1,
							operation_id: "existing-operation",
							workflow_run_id: "33333333332",
							cleanup_verified: 1,
							updated_at: new Date(Date.now() - 1_000).toISOString(),
							last_event_at: new Date(Date.now() - 1_000).toISOString(),
						});
					}
					return new Statement(null, { success: true, meta: { changes: 1 } });
				},
			}),
		);

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: "bootstrap_existing_row_forbidden" });
	});

	it("reclaims the same delivery after an R2 write failure", async () => {
		const occurredAt = new Date().toISOString();
		const snapshot = {
			schemaVersion: 1, projectSlug: "performance-observability-control", captureId: "capture-r2-retry", capturedAt: occurredAt, kind: "synthetic-closed-loop", window: { from: occurredAt, to: occurredAt }, repository: "Tiancheng-Xu/babysteps", commitSha: "0123456789abcdef0123456789abcdef01234567", workflowRunId: "run-r2-retry", sdkVersion: "1.0.0", cleanerVersion: "1.0.0", percentileMethod: "nearest-rank", sampleRate: 1, filters: { environment: "production" }, metrics: [{ name: "LCP", unit: "ms", page: "/performance", route: "/performance", sampleCount: 1, p50: 321, p75: 321, p95: 321, errorCount: 0 }],
		};
		const body = JSON.stringify({ schemaVersion: "1.0", deliveryId: "delivery-r2-retry", source: "control", operationId: "op-r2-retry", generation: 7, workflowRunId: "run-r2-retry", status: "stopped", cleanupVerified: true, zeroResidualVerified: true, occurredAt, snapshot });
		const bodyDigest = createHash("sha256").update(body).digest("hex");
		const timestamp = String(Math.floor(Date.now() / 1000));
		const request = () => new Request("https://baby2b.online/api/performance/control/callback", { method: "POST", headers: { "content-length": String(Buffer.byteLength(body)), "x-performance-timestamp": timestamp, "x-performance-delivery-id": "delivery-r2-retry", "x-performance-signature-256": `sha256=${createHmac("sha256", "callback-secret").update(`${timestamp}.${body}`).digest("hex")}` }, body });
		let delivery: { status: string; body_sha256: string; claimed_at: string; attempts: number } | null = null;
		let putAttempts = 0;
		const retryEnv = env({ prepare: (query) => {
			if (query.includes("INSERT INTO callback_deliveries")) return new Statement(null, { success: true, meta: { changes: delivery ? 0 : (delivery = { status: "processing", body_sha256: bodyDigest, claimed_at: occurredAt, attempts: 1 }, 1) } });
			if (query.includes("FROM callback_deliveries")) return new Statement(delivery);
			if (query.includes("SET status='processing'")) { if (delivery) { delivery.status = "processing"; delivery.attempts += 1; } return new Statement(null, { success: true, meta: { changes: 1 } }); }
			if (query.includes("SET status='failed'")) { if (delivery) delivery.status = "failed"; return new Statement(null, { success: true, meta: { changes: 1 } }); }
			if (query.includes("SET status='applied'")) { if (delivery) delivery.status = "applied"; return new Statement(null, { success: true, meta: { changes: 1 } }); }
			if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "stopping", data_mode: "live", generation: 7, operation_id: "op-r2-retry", workflow_run_id: "run-r2-retry", cleanup_verified: 0, last_event_at: new Date(Date.now() - 1_000).toISOString(), updated_at: new Date(Date.now() - 1_000).toISOString() });
			return new Statement(null, { success: true, meta: { changes: 1 } });
		} });
		retryEnv.SNAPSHOTS.put = async () => {
			putAttempts += 1;
			if (putAttempts === 1) throw new Error("r2_unavailable");
			return { key: "created" };
		};
		expect((await handleRequest(request(), retryEnv)).status).toBe(502);
		expect(delivery).toMatchObject({ status: "failed" });
		expect((await handleRequest(request(), retryEnv)).status).toBe(200);
		expect(delivery).toMatchObject({ status: "applied", attempts: 2 });
	});

	it("rejects oversized callbacks before consuming their stream", async () => {
		const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1])); controller.close(); } });
		const request = new Request("https://baby2b.online/api/performance/control/callback", { method: "POST", headers: { "content-length": "262145" }, body: stream, duplex: "half" } as RequestInit);
		const readerSpy = vi.spyOn(request.body as ReadableStream, "getReader");
		const response = await handleRequest(request, env());
		expect(response.status).toBe(413);
		expect(readerSpy).not.toHaveBeenCalled();
	});

	it("rejects a validly signed callback when header and body delivery ids differ", async () => {
		const occurredAt = new Date().toISOString();
		const body = JSON.stringify({ schemaVersion: "1.0", deliveryId: "body-delivery", source: "control", operationId: "op-delivery", generation: 1, workflowRunId: "run-delivery", status: "running", cleanupVerified: false, zeroResidualVerified: false, occurredAt });
		const timestamp = String(Math.floor(Date.now() / 1000));
		const response = await handleRequest(new Request("https://baby2b.online/api/performance/control/callback", { method: "POST", headers: { "content-length": String(body.length), "x-performance-timestamp": timestamp, "x-performance-delivery-id": "header-delivery", "x-performance-signature-256": `sha256=${createHmac("sha256", "callback-secret").update(`${timestamp}.${body}`).digest("hex")}` }, body }), env());
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "invalid_runtime_callback" });
	});

	it("preserves the Worker TTL when a control callback reports running", async () => {
		const occurredAt = new Date().toISOString();
		const body = JSON.stringify({ schemaVersion: "1.0", deliveryId: "delivery-running-ttl", source: "control", operationId: "op-running-ttl", generation: 4, workflowRunId: "run-running-ttl", status: "running", cleanupVerified: false, zeroResidualVerified: false, occurredAt });
		const timestamp = String(Math.floor(Date.now() / 1000));
		const queries: string[] = [];
		const response = await handleRequest(new Request("https://baby2b.online/api/performance/control/callback", { method: "POST", headers: { "content-length": String(body.length), "x-performance-timestamp": timestamp, "x-performance-delivery-id": "delivery-running-ttl", "x-performance-signature-256": `sha256=${createHmac("sha256", "callback-secret").update(`${timestamp}.${body}`).digest("hex")}` }, body }), env({ prepare: (query) => {
			queries.push(query);
			if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "starting", data_mode: "unavailable", generation: 4, operation_id: "op-running-ttl", workflow_run_id: null, cleanup_verified: 0, expires_at: "2099-01-01T00:00:00.000Z", last_event_at: new Date(Date.now() - 1_000).toISOString(), updated_at: new Date(Date.now() - 1_000).toISOString() });
			return new Statement(null, { success: true, meta: { changes: 1 } });
		} }));
		expect(response.status).toBe(200);
		expect(queries.find((query) => query.includes("UPDATE project_state SET"))).toContain("CASE WHEN");
	});

	it("rejects a stale aws safety expiry reconciliation", async () => {
		const occurredAt = new Date().toISOString();
		const body = JSON.stringify({ schemaVersion: "1.0", deliveryId: "delivery-safety-stale", source: "aws-safety-expiry", operationId: "op-safety-stale", generation: 4, workflowRunId: "run-safety-stale", status: "cleanup_required", cleanupVerified: false, zeroResidualVerified: false, occurredAt });
		const timestamp = String(Math.floor(Date.now() / 1000));
		const response = await handleRequest(new Request("https://baby2b.online/api/performance/control/callback", { method: "POST", headers: { "content-length": String(body.length), "x-performance-timestamp": timestamp, "x-performance-delivery-id": "delivery-safety-stale", "x-performance-signature-256": `sha256=${createHmac("sha256", "callback-secret").update(`${timestamp}.${body}`).digest("hex")}` }, body }), env({ prepare: (query) => {
			if (query.includes("FROM project_state")) return new Statement({ project_slug: "performance-observability-control", control_state: "running", data_mode: "live", generation: 5, operation_id: "op-current", workflow_run_id: "run-current", cleanup_verified: 0, expires_at: "2026-08-26T13:00:00.000Z", last_event_at: new Date(Date.now() - 1_000).toISOString(), updated_at: new Date(Date.now() - 1_000).toISOString() });
			return new Statement(null, { success: true, meta: { changes: 1 } });
		} }));
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: "stale_safety_expiry" });
	});

	it("atomically claims one expired run across overlapping scheduled executions", async () => {
		let claimed = false;
		let dispatches = 0;
		const candidate = { project_slug: "performance-observability-control", control_state: "running", data_mode: "live", generation: 9, operation_id: "old-op", workflow_run_id: "run-9", cleanup_verified: 0, expires_at: "2026-08-26T00:00:00.000Z", snapshot_sha256: null, updated_at: "2026-08-26T00:00:00.000Z" };
		const database = {
			prepare(query: string): D1PreparedStatementLike {
				if (query.startsWith("SELECT * FROM project_state")) return { bind() { return this; }, async first<T>() { return null as T | null; }, async run<T>() { return { success: true, meta: { changes: 0 } } as T; }, async all<T>() { return { results: [candidate as T] }; } };
				return new Statement(null);
			},
			async batch(statements: D1PreparedStatementLike[]) { expect(statements).toHaveLength(3); const changes = claimed ? 0 : 1; claimed = true; return statements.map(() => ({ success: true, meta: { changes } })); },
		};
		vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			const url = String(input);
			if (url.includes("/access_tokens")) return new Response(JSON.stringify({ token: "scheduled-token" }));
			if (url.includes("/dispatches")) { const dispatch = JSON.parse(String(init?.body)); expect(dispatch.inputs).toEqual({ action: "stop", operation_id: expect.any(String), generation: "9", expires_at: candidate.expires_at, estimated_cost_usd: "0.20" }); expect(dispatch.inputs.operation_id).not.toBe(candidate.operation_id); dispatches += 1; return new Response(null, { status: 204 }); }
			throw new Error(`unexpected fetch ${url}`);
		}));
		const scheduledEnv = { ...env(), CONTROL_DB: database } as WorkerEnv;
		await Promise.all([reconcileExpiredControls(scheduledEnv), reconcileExpiredControls(scheduledEnv)]);
		expect(dispatches).toBe(1);
	});
});
