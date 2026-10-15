const encoder = new TextEncoder();
const summaryFields = [
	"id", "title", "status", "progress", "repo", "evidenceUrl", "ownerPage", "sourceUpdatedAt",
];

export async function projectReadback(request, storedEnvelope) {
	const params = new URL(request.url).searchParams;
	const query = parseQuery(params);
	if (!query) return errorResponse(request, 400, "INVALID_QUERY");
	const envelope = storedEnvelope ?? {
		schemaVersion: 1,
		generatedAt: new Date(0).toISOString(),
		projectCount: 0,
		projects: [],
		status: "warming",
	};
	const originalBody = JSON.stringify(envelope);
	const revision = await digest(originalBody);
	let body = originalBody;
	if (query.paged) {
		const matches = query.id === null
			? envelope.projects
			: envelope.projects.filter(project => project.id === query.id);
		const cursor = query.cursor;
		if (cursor && (cursor.view !== query.view || cursor.id !== query.id || cursor.limit !== query.limit)) {
			return errorResponse(request, 400, "CURSOR_QUERY_MISMATCH");
		}
		if (cursor && cursor.revision !== revision) {
			return errorResponse(request, 409, "SNAPSHOT_CHANGED");
		}
		if (cursor && cursor.offset >= matches.length) {
			return errorResponse(request, 400, "INVALID_CURSOR");
		}
		const offset = cursor?.offset ?? 0;
		const selected = matches.slice(offset, offset + query.limit);
		const nextOffset = offset + selected.length;
		body = JSON.stringify({
			schemaVersion: envelope.schemaVersion,
			generatedAt: envelope.generatedAt,
			projectCount: envelope.projectCount,
			status: envelope.status,
			...(envelope.warningCount !== undefined ? { warningCount: envelope.warningCount } : {}),
			view: query.view,
			matchedCount: matches.length,
			returnedCount: selected.length,
			projects: query.view === "summary" ? selected.map(summary) : selected,
			nextCursor: nextOffset < matches.length
				? encodeCursor({ revision, offset: nextOffset, view: query.view, id: query.id, limit: query.limit })
				: null,
		});
	}
	return jsonReadback(request, body, query.paged ? undefined : revision);
}

export async function jsonReadback(request, body, knownDigest) {
	const etag = `W/"sha256-${knownDigest ?? await digest(body)}"`;
	const headers = {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "public, max-age=30, s-maxage=30",
		ETag: etag,
	};
	if (matchesValidator(request.headers.get("If-None-Match"), etag)) {
		return new Response(null, { status: 304, headers });
	}
	headers["Content-Length"] = String(encoder.encode(body).byteLength);
	return new Response(request.method === "HEAD" ? null : body, { headers });
}

function parseQuery(params) {
	for (const key of ["view", "id", "limit", "cursor"]) {
		if (params.getAll(key).length > 1) return null;
	}
	const view = params.get("view") ?? "full";
	const id = params.get("id");
	const rawLimit = params.get("limit");
	if (!["full", "summary"].includes(view)) return null;
	if (id !== null && !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(id)) return null;
	if (rawLimit !== null && !/^[1-9][0-9]?$/.test(rawLimit)) return null;
	const limit = rawLimit === null ? 20 : Number(rawLimit);
	if (limit > 50) return null;
	const rawCursor = params.get("cursor");
	const cursor = rawCursor === null ? null : decodeCursor(rawCursor);
	if (rawCursor !== null && !cursor) return null;
	return {
		view, id, limit, cursor,
		paged: ["view", "id", "limit", "cursor"].some(key => params.has(key)),
	};
}

function summary(project) {
	return Object.fromEntries(summaryFields
		.filter(field => project[field] !== undefined)
		.map(field => [field, project[field]]));
}

function encodeCursor(cursor) {
	return btoa(JSON.stringify(cursor)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeCursor(value) {
	if (value.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
	try {
		const cursor = JSON.parse(atob(value.replace(/-/g, "+").replace(/_/g, "/")));
		if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) return null;
		if (Object.keys(cursor).sort().join(",") !== "id,limit,offset,revision,view") return null;
		if (!/^[a-f0-9]{64}$/.test(cursor.revision)) return null;
		if (!Number.isSafeInteger(cursor.offset) || cursor.offset < 1) return null;
		if (!Number.isInteger(cursor.limit) || cursor.limit < 1 || cursor.limit > 50) return null;
		if (!["full", "summary"].includes(cursor.view)) return null;
		if (cursor.id !== null && (typeof cursor.id !== "string" || !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(cursor.id))) return null;
		return cursor;
	} catch {
		return null;
	}
}

async function digest(value) {
	const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
	return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function matchesValidator(value, etag) {
	if (!value || value.length > 8192) return false;
	if (value.trim() === "*") return true;
	const expected = etag.startsWith("W/") ? etag.slice(2) : etag;
	let offset = 0;
	let matched = false;
	while (offset < value.length) {
		while (value[offset] === " " || value[offset] === "\t") offset++;
		if (offset === value.length) break;
		// HTTP list recipients ignore empty elements; commas inside tags stay data.
		if (value[offset] === ",") { offset++; continue; }
		if (value.startsWith("W/", offset)) offset += 2;
		if (value[offset] !== '"') return false;
		const start = offset++;
		while (offset < value.length && value[offset] !== '"') {
			const code = value.charCodeAt(offset++);
			if (!(code === 0x21 || (code >= 0x23 && code <= 0x7e) || (code >= 0x80 && code <= 0xff))) return false;
		}
		if (offset === value.length) return false;
		offset++;
		if (value.slice(start, offset) === expected) matched = true;
		while (value[offset] === " " || value[offset] === "\t") offset++;
		if (offset < value.length && value[offset++] !== ",") return false;
	}
	return matched;
}

function errorResponse(request, status, error) {
	return new Response(request.method === "HEAD" ? null : JSON.stringify({ error }), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
	});
}
