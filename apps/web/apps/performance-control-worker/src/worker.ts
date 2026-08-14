import { getRegisteredProject } from "./registry";
import {
	assertSnapshotPublishable,
	latestPointerKey,
	type PerformanceSnapshot,
} from "./snapshot";

export interface D1PreparedStatementLike {
	bind(...values: unknown[]): D1PreparedStatementLike;
	first<T>(): Promise<T | null>;
}

export interface D1DatabaseLike {
	prepare(query: string): D1PreparedStatementLike;
}

export interface R2ObjectLike {
	text(): Promise<string>;
}

export interface R2BucketLike {
	get(key: string): Promise<R2ObjectLike | null>;
}

export interface WorkerEnv {
	CONTROL_DB: D1DatabaseLike;
	SNAPSHOTS: R2BucketLike;
	CONTROL_ENABLED?: string;
}

interface PublicStateRow {
	project_slug: string;
	control_state: string;
	data_mode: string;
	cleanup_verified: number;
	snapshot_sha256: string | null;
	updated_at: string;
}

interface LatestPointer {
	key: string;
	sha256: string;
}

const digestPattern = /^[a-f0-9]{64}$/;

const json = (body: unknown, init: ResponseInit = {}) => {
	const headers = new Headers(init.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	headers.set("x-content-type-options", "nosniff");
	return new Response(JSON.stringify(body), { ...init, headers });
};

const projectFrom = (url: URL) => {
	const projectSlug = url.searchParams.get("project") ?? "";
	return { projectSlug, project: getRegisteredProject(projectSlug) };
};

const sha256 = async (value: string) => {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(value),
	);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
};

const publicStatus = async (url: URL, env: WorkerEnv) => {
	const { projectSlug, project } = projectFrom(url);
	if (!project) return json({ error: "unknown_project" }, { status: 404 });

	const row = await env.CONTROL_DB.prepare(
		`SELECT project_slug, control_state, data_mode, cleanup_verified,
		        snapshot_sha256, updated_at
		   FROM project_state
		  WHERE project_slug = ?1`,
	)
		.bind(projectSlug)
		.first<PublicStateRow>();

	if (!row) {
		return json(
			{
				projectSlug,
				controlState: "stopped",
				dataMode: "unavailable",
				cleanupVerified: true,
				snapshotAvailable: false,
				metrics: [],
				updatedAt: null,
			},
			{ headers: { "cache-control": "public, max-age=15" } },
		);
	}

	return json(
		{
			projectSlug: row.project_slug,
			controlState: row.control_state,
			dataMode: row.data_mode,
			cleanupVerified: row.cleanup_verified === 1,
			snapshotAvailable: Boolean(row.snapshot_sha256),
			metrics: [],
			updatedAt: row.updated_at,
		},
		{ headers: { "cache-control": "public, max-age=15" } },
	);
};

const publicSnapshot = async (request: Request, url: URL, env: WorkerEnv) => {
	const { projectSlug, project } = projectFrom(url);
	if (!project) return json({ error: "unknown_project" }, { status: 404 });

	const pointerObject = await env.SNAPSHOTS.get(latestPointerKey(projectSlug));
	if (!pointerObject) {
		return json({ error: "verified_snapshot_not_found" }, { status: 404 });
	}

	let pointer: LatestPointer;
	try {
		pointer = JSON.parse(await pointerObject.text()) as LatestPointer;
	} catch {
		return json({ error: "invalid_snapshot_pointer" }, { status: 502 });
	}
	const expectedPrefix = `performance/${projectSlug}/captures/`;
	if (
		!pointer ||
		!pointer.key?.startsWith(expectedPrefix) ||
		!pointer.key.endsWith(".json") ||
		pointer.key.includes("..") ||
		!digestPattern.test(pointer.sha256)
	) {
		return json({ error: "invalid_snapshot_pointer" }, { status: 502 });
	}

	if (request.headers.get("if-none-match") === `"${pointer.sha256}"`) {
		return new Response(null, {
			status: 304,
			headers: { etag: `"${pointer.sha256}"` },
		});
	}

	const snapshotObject = await env.SNAPSHOTS.get(pointer.key);
	if (!snapshotObject) {
		return json({ error: "snapshot_object_missing" }, { status: 502 });
	}
	const rawSnapshot = await snapshotObject.text();
	if ((await sha256(rawSnapshot)) !== pointer.sha256) {
		return json({ error: "snapshot_digest_mismatch" }, { status: 502 });
	}

	let snapshot: PerformanceSnapshot;
	try {
		snapshot = JSON.parse(rawSnapshot) as PerformanceSnapshot;
		assertSnapshotPublishable(snapshot, { immutableObjectExists: false });
	} catch {
		return json({ error: "invalid_snapshot_contract" }, { status: 502 });
	}
	if (snapshot.projectSlug !== projectSlug) {
		return json({ error: "snapshot_project_mismatch" }, { status: 502 });
	}

	return json(snapshot, {
		headers: {
			"cache-control": "public, max-age=60, stale-if-error=86400",
			etag: `"${pointer.sha256}"`,
		},
	});
};

export const handleRequest = async (request: Request, env: WorkerEnv) => {
	const url = new URL(request.url);
	if (request.method === "GET" && url.pathname === "/api/performance/status") {
		return publicStatus(url, env);
	}
	if (request.method === "GET" && url.pathname === "/api/performance/snapshot") {
		return publicSnapshot(request, url, env);
	}
	if (
		request.method === "POST" &&
		url.pathname.startsWith("/api/performance/control/")
	) {
		// Enabling a variable alone must never unlock AWS mutations. This remains
		// fail-closed until Cloudflare Access JWT verification and the fixed
		// GitHub App workflow dispatcher are deployed and tested together.
		return json(
			{ error: "control_not_deployed", retryable: false },
			{ status: 503, headers: { "cache-control": "no-store" } },
		);
	}

	return json({ error: "not_found" }, { status: 404 });
};
