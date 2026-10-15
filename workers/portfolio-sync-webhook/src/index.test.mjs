import assert from "node:assert/strict";
import test from "node:test";

import worker, { isProjectOwnedEvidenceUrl } from "./index.mjs";

test("accepts project-owned Evidence on the production host", () => {
	assert.equal(
		isProjectOwnedEvidenceUrl(
			"https://agent-market.baby2b.online/evidence/",
			"agent-market",
			"https://agent-market.baby2b.online/",
		),
		true,
	);
});

test("accepts Dashboard-owned Evidence with the exact project slug", () => {
	assert.equal(
		isProjectOwnedEvidenceUrl(
			"https://baby2b.online/evidence/tc-workflow",
			"tc-workflow",
			"https://tc-workflow.baby2b.online/",
		),
		true,
	);
});

test("rejects the retired Evidence Hub and mismatched paths", () => {
	for (const url of [
		"https://evidence.baby2b.online/agent-market/",
		"https://baby2b.online/evidence/wrong-project",
		"https://agent-market.baby2b.online/evidence/private",
		"https://other.baby2b.online/evidence/",
	]) {
		assert.equal(
			isProjectOwnedEvidenceUrl(
				url,
				"agent-market",
				"https://agent-market.baby2b.online/",
			),
			false,
			url,
		);
	}
});

const snapshot = {
	schemaVersion: 1,
	generatedAt: "2026-10-13T12:00:00.000Z",
	projectCount: 3,
	projects: [
		{
			id: "agent-market", title: "Agent Market", status: "已完成", progress: 100,
			repo: "Tiancheng-Xu/agent-market",
			evidenceUrl: "https://agent-market.baby2b.online/evidence/",
			ownerPage: "https://agent-market.baby2b.online/",
			sourceUpdatedAt: "2026-10-12T12:00:00Z",
			desc: "任务交付平台", architecture: "A deliberately detailed architecture",
			details: ["A long implementation narrative"], skills: ["TypeScript"], evidence: ["Tests"],
		},
		{
			id: "office-workflow-agent", title: "OfficeFlow", status: "进行中", progress: 80,
			repo: "Tiancheng-Xu/office-workflow-agent",
			evidenceUrl: "https://office-workflow-agent.baby2b.online/evidence/",
			desc: "受控采购流程", details: ["Approval and reconciliation"], skills: [], evidence: [],
		},
		{
			id: "babysteps", title: "BabySteps", status: "已完成", progress: 100,
			repo: "Tiancheng-Xu/babysteps",
			evidenceUrl: "https://babysteps.baby2b.online/evidence/",
			desc: "家庭成长产品", details: ["Family workflows"], skills: [], evidence: [],
		},
	],
	status: "ready",
	trigger: "scheduled",
	warningCount: 0,
};

async function read(path = "/projects.json", options = {}, value = snapshot) {
	const env = {
		PORTFOLIO: {
			async get(key, format) {
				assert.equal(key, "portfolio:index");
				assert.equal(format, "json");
				return structuredClone(value);
			},
		},
	};
	return worker.fetch(new Request("https://portfolio-sync.example" + path, options), env, {});
}

test("legacy readback preserves the complete existing JSON envelope", async () => {
	const response = await read();
	assert.equal(response.status, 200);
	assert.deepEqual(await response.json(), snapshot);
});

test("summary omits narratives and paginates without losing the continuation", async () => {
	const response = await read("/projects.json?view=summary&limit=2");
	assert.equal(response.status, 200);
	const first = await response.json();
	assert.deepEqual(first.projects, [
		{
			id: "agent-market", title: "Agent Market", status: "已完成", progress: 100,
			repo: "Tiancheng-Xu/agent-market",
			evidenceUrl: "https://agent-market.baby2b.online/evidence/",
			ownerPage: "https://agent-market.baby2b.online/",
			sourceUpdatedAt: "2026-10-12T12:00:00Z",
		},
		{
			id: "office-workflow-agent", title: "OfficeFlow", status: "进行中", progress: 80,
			repo: "Tiancheng-Xu/office-workflow-agent",
			evidenceUrl: "https://office-workflow-agent.baby2b.online/evidence/",
		},
	]);
	assert.equal(first.projectCount, 3);
	assert.equal(first.matchedCount, 3);
	assert.equal(first.returnedCount, 2);
	assert.equal(typeof first.nextCursor, "string");
	const next = await read("/projects.json?view=summary&limit=2&cursor=" + encodeURIComponent(first.nextCursor));
	const second = await next.json();
	assert.deepEqual(second.projects.map(project => project.id), ["babysteps"]);
	assert.equal(second.nextCursor, null);
});

test("an exact project lookup supplies full details only for the selected project", async () => {
	const response = await read("/projects.json?id=office-workflow-agent");
	const body = await response.json();
	assert.deepEqual(body.projects, [snapshot.projects[1]]);
	assert.equal(body.projectCount, 3);
	assert.equal(body.matchedCount, 1);
	assert.equal(body.returnedCount, 1);
	assert.equal(body.nextCursor, null);
	const missing = await (await read("/projects.json?id=missing")).json();
	assert.deepEqual(missing.projects, []);
	assert.equal(missing.matchedCount, 0);
});

test("invalid or duplicated query bounds are rejected", async () => {
	for (const query of ["view=raw", "view=summary&view=full", "limit=0", "limit=51", "limit=-1", "limit=1.5", "limit=1&limit=2", "id=", "id=../private", "cursor=garbage", "cursor=", "cursor=" + "x".repeat(1025)]) {
		const response = await read("/projects.json?" + query);
		assert.equal(response.status, 400, query);
		assert.equal(response.headers.get("Cache-Control"), "no-store");
	}
});

test("compact requests default to a bounded page and enforce the fifty-item maximum", async () => {
	const value = { ...snapshot, projectCount: 60, projects: Array.from({ length: 60 }, (_, i) => ({ ...snapshot.projects[0], id: "project-" + i })) };
	const defaultPage = await (await read("/projects.json?view=summary", {}, value)).json();
	assert.equal(defaultPage.projects.length, 20);
	const largestPage = await (await read("/projects.json?view=summary&limit=50", {}, value)).json();
	assert.equal(largestPage.projects.length, 50);
	assert.equal(largestPage.matchedCount, 60);
	assert.equal(typeof largestPage.nextCursor, "string");
});

test("continuations reject a changed snapshot or different query instead of skipping data", async () => {
	const first = await (await read("/projects.json?view=summary&limit=1")).json();
	const cursor = encodeURIComponent(first.nextCursor);
	const value = { ...snapshot, generatedAt: "2026-10-13T12:30:00.000Z" };
	assert.equal((await read("/projects.json?view=summary&limit=1&cursor=" + cursor, {}, value)).status, 409);
	for (const query of ["view=full&limit=1", "view=summary&limit=2", "view=summary&limit=1&id=babysteps"]) {
		assert.equal((await read("/projects.json?" + query + "&cursor=" + cursor)).status, 400);
	}
});

test("unchanged public responses revalidate with a bodyless 304", async () => {
	const first = await read();
	const etag = first.headers.get("ETag");
	assert.match(etag, /^W\/"sha256-[a-f0-9]{64}"$/);
	const next = await read("/projects.json", { headers: { "If-None-Match": etag } });
	assert.equal(next.status, 304);
	assert.equal(await next.text(), "");
	assert.equal(next.headers.get("ETag"), etag);
	assert.equal(next.headers.get("Access-Control-Allow-Origin"), "*");
});

test("conditional GET uses weak comparison and supports a list and wildcard", async () => {
	const etag = (await read()).headers.get("ETag");
	assert.ok(etag);
	for (const value of [etag.slice(2), '"different", ' + etag, '"different,quoted", ' + etag, ", " + etag, etag + ",", etag + ', , "other"', "*"]) {
		assert.equal((await read("/projects.json", { headers: { "If-None-Match": value } })).status, 304, value);
	}
	for (const value of ['"different"', "junk " + etag, "*, " + etag]) {
		assert.equal((await read("/projects.json", { headers: { "If-None-Match": value } })).status, 200, value);
	}
});

test("oversized conditional headers fall back to GET within a fixed parsing bound", async () => {
	const etag = (await read()).headers.get("ETag");
	const oversized = '"' + "x".repeat(8192) + '", ' + etag;
	assert.equal((await read("/projects.json", { headers: { "If-None-Match": oversized } })).status, 200);
	const reasonableEmptyList = ",".repeat(16) + etag;
	assert.equal((await read("/projects.json", { headers: { "If-None-Match": reasonableEmptyList } })).status, 304);
});

test("a changed payload or different representation cannot reuse the old validator", async () => {
	const etag = (await read()).headers.get("ETag");
	const value = structuredClone(snapshot);
	value.projects[0].progress = 99;
	const changed = await read("/projects.json", { headers: { "If-None-Match": etag } }, value);
	assert.equal(changed.status, 200);
	assert.notEqual(changed.headers.get("ETag"), etag);
	const summary = await read("/projects.json?view=summary", { headers: { "If-None-Match": etag } });
	assert.equal(summary.status, 200);
	assert.notEqual(summary.headers.get("ETag"), etag);
});

test("HEAD has the same validator and byte length as GET without a body", async () => {
	const get = await read("/projects.json?view=summary");
	const bytes = new TextEncoder().encode(await get.text()).byteLength;
	const head = await read("/projects.json?view=summary", { method: "HEAD" });
	assert.equal(head.status, 200);
	assert.equal(await head.text(), "");
	assert.equal(head.headers.get("ETag"), get.headers.get("ETag"));
	assert.equal(head.headers.get("Content-Length"), String(bytes));
	assert.equal((await read("/projects.json", { method: "HEAD", headers: { "If-None-Match": "*" } })).status, 304);
});

test("public CORS enables conditional reads and exposes validators", async () => {
	const preflight = await read("/projects.json", { method: "OPTIONS" });
	assert.equal(preflight.status, 204);
	assert.match(preflight.headers.get("Access-Control-Allow-Methods"), /HEAD/);
	assert.match(preflight.headers.get("Access-Control-Allow-Headers"), /If-None-Match/i);
	const get = await read();
	assert.match(get.headers.get("Access-Control-Expose-Headers"), /ETag/i);
	assert.equal((await read("/projects.json", { method: "POST" })).status, 404);
});

test("an empty cold snapshot reports warming in both representations", async () => {
	const expected = { schemaVersion: 1, generatedAt: "1970-01-01T00:00:00.000Z", projectCount: 0, projects: [], status: "warming" };
	assert.deepEqual(await (await read("/projects.json", {}, null)).json(), expected);
	const summary = await (await read("/projects.json?view=summary", {}, null)).json();
	assert.equal(summary.status, "warming");
	assert.equal(summary.matchedCount, 0);
	assert.equal(summary.nextCursor, null);
});

test("OpenAPI discovery is public and describes the implemented read bounds", async () => {
	const response = await read("/openapi.json");
	assert.equal(response.status, 200);
	const spec = await response.json();
	assert.equal(spec.openapi, "3.1.1");
	assert.deepEqual(Object.keys(spec.paths), ["/projects.json"]);
	const get = spec.paths["/projects.json"].get;
	assert.equal(get.operationId, "readPortfolioProjects");
	assert.equal(spec.components.parameters.Limit.schema.maximum, 50);
	assert.equal(spec.components.parameters.Limit.schema.minimum, 1);
	assert.ok(get.responses["304"]);
	assert.ok(get.responses["409"]);
	const cached = await read("/openapi.json", { headers: { "If-None-Match": response.headers.get("ETag") } });
	assert.equal(cached.status, 304);
	const head = await read("/openapi.json", { method: "HEAD" });
	assert.equal(head.status, 200);
	assert.equal(await head.text(), "");
});
