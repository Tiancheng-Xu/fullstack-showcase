import assert from "node:assert/strict";
import test from "node:test";
import {
	collectRepositories,
	buildSnapshot,
} from "./refresh-open-source-status.mjs";

const href = "https://github.com/acme/repo/pull/1";
const repositories = () => collectRepositories(`${href} ${href}`);
const valid = () => ({
	data: {
		r0: {
			stargazerCount: 2000,
			p0: {
				state: "MERGED",
				mergedAt: "2026-10-01T00:00:00Z",
				isDraft: false,
				author: { login: "Tiancheng-Xu" },
			},
		},
	},
});

test("collects unique curated links and records complete verified results", () => {
	assert.equal(repositories().size, 1);
	assert.equal(repositories().get("acme/repo").prs.length, 1);
	const result = buildSnapshot(repositories(), valid());
	assert.equal(result.pullRequests[href].state, "MERGED");
	assert.equal(result.repositories["acme/repo"], 2000);
});

test("rejects empty input and partial API results", () => {
	assert.throws(() => collectRepositories("no links"));
	assert.throws(() => buildSnapshot(repositories(), { data: {} }));
	assert.throws(() =>
		buildSnapshot(repositories(), {
			...valid(),
			errors: [{ message: "failed" }],
		}),
	);
});

test("rejects unexpected author, missing draft, invalid state, stars or merge timestamp", () => {
	for (const change of [
		(pr) => {
			pr.author.login = "someone-else";
		},
		(pr) => {
			delete pr.isDraft;
		},
		(pr) => {
			pr.state = "UNKNOWN";
		},
		(pr) => {
			pr.mergedAt = null;
		},
		(pr) => {
			pr.mergedAt = "invalid";
		},
	]) {
		const data = valid();
		change(data.data.r0.p0);
		assert.throws(() => buildSnapshot(repositories(), data));
	}
	const data = valid();
	data.data.r0.stargazerCount = -1;
	assert.throws(() => buildSnapshot(repositories(), data));
});

test("requires null merge time for every open or closed unmerged PR", () => {
	for (const state of ["OPEN", "CLOSED"]) {
		for (const mergedAt of [undefined, "2026-10-01T00:00:00Z"]) {
			const data = valid();
			Object.assign(data.data.r0.p0, { state, mergedAt });
			assert.throws(() => buildSnapshot(repositories(), data));
		}
		const data = valid();
		Object.assign(data.data.r0.p0, { state, mergedAt: null });
		assert.equal(buildSnapshot(repositories(), data).pullRequests[href].state, state);
	}
});
