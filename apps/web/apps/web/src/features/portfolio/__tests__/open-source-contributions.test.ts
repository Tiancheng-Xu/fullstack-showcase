import { describe, expect, it } from "vitest";

import {
	buildOpenSourceRepositoryDetails,
	orderOpenSourceContributions,
	reconcileOpenSourceContributions,
} from "../open-source-contributions";
import {
	openSourceContributions,
	openSourceContributionsInReview,
	openSourceRepositoryDetails,
} from "../open-source-data";
import snapshot from "../open-source-status.json";

describe("public open-source contributions", () => {
	it("classifies the verified Vite restart fix as merged on both public surfaces", () => {
		const vite = openSourceRepositoryDetails.find(
			({ project }) => project === "Vite",
		);
		expect(
			vite?.pullRequests.find(({ label }) => label === "#23499"),
		).toMatchObject({
			status: "merged",
			contribution: "开发服务器重启完成初始化后释放旧环境引用",
		});
		expect(vite).toMatchObject({ merged: 2, open: 0 });
	});

	it("includes the published Prefect, Monty and Rspack contributions", () => {
		for (const href of [
			"https://github.com/PrefectHQ/prefect/pull/23302",
			"https://github.com/pydantic/monty/pull/973",
			"https://github.com/web-infra-dev/rspack/pull/15969",
		]) {
			expect(
				openSourceRepositoryDetails.flatMap(({ pullRequests }) => pullRequests),
			).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ href, status: snapshot.pullRequests[href as keyof typeof snapshot.pullRequests].state === "MERGED" ? "merged" : "open" }),
				]),
			);
		}
	});

	it("does not count the superseded MCP resources PR as open or merged", () => {
		expect(
			openSourceRepositoryDetails.flatMap(({ pullRequests }) =>
				pullRequests.map(({ href }) => href),
			),
		).not.toContain(
			"https://github.com/modelcontextprotocol/servers/pull/4810",
		);
	});

	it("only shows repositories with at least 1,000 stars", () => {
		for (const repository of [
			...openSourceContributions,
			...openSourceContributionsInReview,
		]) {
			expect(repository.stars, repository.project).toBeGreaterThanOrEqual(1000);
		}
	});

	it("matches every public PR state and draft flag to the verified snapshot", () => {
		for (const pr of openSourceRepositoryDetails.flatMap(({ pullRequests }) => pullRequests)) {
			const verified = snapshot.pullRequests[pr.href as keyof typeof snapshot.pullRequests];
			expect(verified.state).toBe(pr.status === "merged" ? "MERGED" : "OPEN");
			expect(pr.draft).toBe(verified.draft);
		}
	});
});

describe("orderOpenSourceContributions", () => {
	it("sorts repositories by stars and keeps same-repository PRs together in descending order", () => {
		const ordered = orderOpenSourceContributions([
			{
				project: "Lower star repository",
				stars: 20,
				pullRequests: [
					{ label: "#9", href: "https://example.com/9", contribution: "Nine" },
					{
						label: "#12",
						href: "https://example.com/12",
						contribution: "Twelve",
					},
				],
			},
			{
				project: "Higher star repository",
				stars: 200,
				pullRequests: [
					{ label: "#3", href: "https://example.com/3", contribution: "Three" },
				],
			},
		]);

		expect(ordered.map(({ project }) => project)).toEqual([
			"Higher star repository",
			"Lower star repository",
		]);
		expect(ordered[1].pullRequests.map(({ label }) => label)).toEqual([
			"#12",
			"#9",
		]);
	});

	it("builds repository details with merged, open and optional issue links", () => {
		const details = buildOpenSourceRepositoryDetails(
			[
				{
					project: "Repo",
					stars: 10,
					pullRequests: [
						{
							label: "#2",
							href: "https://github.com/acme/repo/pull/2",
							contribution: "Merged fix",
						},
					],
				},
			],
			[
				{
					project: "Repo",
					stars: 12,
					pullRequests: [
						{
							label: "#3",
							href: "https://github.com/acme/repo/pull/3",
							issueHref: "https://github.com/acme/repo/issues/1",
							contribution: "Open fix",
						},
					],
				},
			],
		);

		expect(details).toHaveLength(1);
		expect(details[0]).toMatchObject({
			project: "Repo",
			stars: 12,
			merged: 1,
			open: 1,
		});
		expect(details[0].pullRequests).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ label: "#2", status: "merged" }),
				expect.objectContaining({
					label: "#3",
					status: "open",
					issueHref: "https://github.com/acme/repo/issues/1",
				}),
			]),
		);
	});

	it("places merged repositories first and sorts each status group by stars", () => {
		const details = buildOpenSourceRepositoryDetails(
			[
				{
					project: "Merged Small",
					stars: 10,
					pullRequests: [
						{
							label: "#1",
							href: "https://github.com/acme/small/pull/1",
							contribution: "Fix",
						},
					],
				},
				{
					project: "Merged Large",
					stars: 20,
					pullRequests: [
						{
							label: "#2",
							href: "https://github.com/acme/large/pull/2",
							contribution: "Fix",
						},
					],
				},
			],
			[
				{
					project: "Open Small",
					stars: 100,
					pullRequests: [
						{
							label: "#3",
							href: "https://github.com/acme/open-small/pull/3",
							contribution: "Fix",
						},
					],
				},
				{
					project: "Open Large",
					stars: 200,
					pullRequests: [
						{
							label: "#4",
							href: "https://github.com/acme/open-large/pull/4",
							contribution: "Fix",
						},
					],
				},
			],
		);

		expect(details.map(({ project }) => project)).toEqual([
			"Merged Large",
			"Merged Small",
			"Open Large",
			"Open Small",
		]);
	});
});

describe("reconcileOpenSourceContributions", () => {
	const href = "https://github.com/acme/repo/pull/1";
	const items = [
		{
			project: "Repo",
			stars: 9999,
			pullRequests: [{ label: "#1", href, contribution: "Fix" }],
		},
	];
	const snapshot = (state: "OPEN" | "MERGED" | "CLOSED", stars = 2000) => ({
		repositories: { "acme/repo": stars },
		pullRequests: {
			[href]: {
				state,
				mergedAt: state === "MERGED" ? "2026-10-01T00:00:00Z" : null,
				draft: false,
			},
		},
	});

	it("uses verified state instead of old grouping, deduplicates and retains narration", () => {
		const result = reconcileOpenSourceContributions(
			[...items, ...items],
			snapshot("MERGED"),
		);
		expect(result.open).toEqual([]);
		expect(result.merged).toEqual([
			{
				...items[0],
				stars: 2000,
				pullRequests: [{ ...items[0].pullRequests[0], draft: false }],
			},
		]);
		expect(
			reconcileOpenSourceContributions(items, snapshot("OPEN")).open,
		).toHaveLength(1);
	});

	it("excludes closed unmerged PRs and uses current stars for the public gate", () => {
		expect(reconcileOpenSourceContributions(items, snapshot("CLOSED"))).toEqual(
			{ merged: [], open: [] },
		);
		expect(
			reconcileOpenSourceContributions(items, snapshot("OPEN", 999)),
		).toEqual({ merged: [], open: [] });
		expect(
			reconcileOpenSourceContributions(items, snapshot("OPEN", 1000)).open,
		).toHaveLength(1);
	});

	it("fails closed when any curated PR or repository has no verified metadata", () => {
		expect(() =>
			reconcileOpenSourceContributions(items, {
				repositories: {},
				pullRequests: {},
			}),
		).toThrow();
		expect(() =>
			reconcileOpenSourceContributions(items, {
				...snapshot("OPEN"),
				pullRequests: {},
			}),
		).toThrow();
	});
});
