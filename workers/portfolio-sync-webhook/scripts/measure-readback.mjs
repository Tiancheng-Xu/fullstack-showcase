import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import worker from "../src/index.mjs";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Pass the local public portfolio-projects.json build artifact.");
if ((await stat(inputPath)).size > 2_000_000) throw new Error("Input exceeds the two-megabyte measurement bound.");
const input = await readFile(inputPath);
const envelope = JSON.parse(input.toString("utf8"));
if (envelope.schemaVersion !== 1 || !Array.isArray(envelope.projects)) throw new Error("Invalid public portfolio envelope.");
const env = { PORTFOLIO: { async get(key, type) {
	if (key !== "portfolio:index" || type !== "json") throw new Error("Unexpected KV access.");
	return envelope;
} } };
async function request(query = "", options = {}) {
	const response = await worker.fetch(new Request("https://portfolio-sync.example/projects.json" + query, options), env, {});
	const text = await response.text();
	return { status: response.status, bytes: Buffer.byteLength(text), etag: response.headers.get("ETag"), value: text ? JSON.parse(text) : null };
}
const full = await request();
const firstPage = await request("?view=summary");
let page = firstPage;
let summaryBytes = 0;
let pages = 0;
const ids = [];
do {
	if (page.status !== 200 || !page.value) throw new Error("Summary read failed.");
	summaryBytes += page.bytes;
	pages++;
	ids.push(...page.value.projects.map(project => project.id));
	if (pages > 100) throw new Error("Pagination did not terminate within the measurement bound.");
	page = page.value.nextCursor ? await request("?view=summary&cursor=" + encodeURIComponent(page.value.nextCursor)) : null;
} while (page);
if (JSON.stringify(ids) !== JSON.stringify(envelope.projects.map(project => project.id))) throw new Error("Summary lost or reordered project identities.");
const conditional = await request("", { headers: { "If-None-Match": full.etag } });
const head = await request("", { method: "HEAD" });
if (conditional.status !== 304 || conditional.bytes !== 0 || head.status !== 200 || head.bytes !== 0) throw new Error("Conditional or HEAD measurement failed.");
const single = envelope.projects.length ? await request("?id=" + encodeURIComponent(envelope.projects[0].id)) : null;
console.log(JSON.stringify({
	schemaVersion: 1,
	fixtureKind: "local-public-build-artifact",
	fixtureSha256: createHash("sha256").update(input).digest("hex"),
	projectCount: envelope.projects.length,
	measurement: "UTF-8 uncompressed response-body bytes; same fixture for every request",
	full: { status: full.status, bodyBytes: full.bytes },
	summary: { firstPageBytes: firstPage.bytes, pages, completeBodyBytes: summaryBytes, projectIdentitiesPreserved: true, reductionPercent: full.bytes ? Math.round((1 - summaryBytes / full.bytes) * 10000) / 100 : null },
	exactProject: single ? { id: envelope.projects[0].id, bodyBytes: single.bytes } : null,
	conditional: { status: conditional.status, bodyBytes: conditional.bytes },
	head: { status: head.status, bodyBytes: head.bytes },
	tokenSavings: "not measured",
	workerCpuSavings: "not measured; KV reads, serialization and hashing still execute",
	productionDeployment: "not performed",
}, null, 2));
