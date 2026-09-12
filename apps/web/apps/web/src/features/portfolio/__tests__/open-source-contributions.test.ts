import { describe, expect, it } from "vitest";

import { buildOpenSourceRepositoryDetails, orderOpenSourceContributions } from "../open-source-contributions";

describe("orderOpenSourceContributions", () => {
	it("sorts repositories by stars and keeps same-repository PRs together in descending order", () => {
		const ordered = orderOpenSourceContributions([
			{
				project: "Lower star repository",
				stars: 20,
				pullRequests: [
					{ label: "#9", href: "https://example.com/9", contribution: "Nine" },
					{ label: "#12", href: "https://example.com/12", contribution: "Twelve" },
				],
			},
			{
				project: "Higher star repository",
				stars: 200,
				pullRequests: [{ label: "#3", href: "https://example.com/3", contribution: "Three" }],
			},
		]);

		expect(ordered.map(({ project }) => project)).toEqual([
			"Higher star repository",
			"Lower star repository",
		]);
		expect(ordered[1].pullRequests.map(({ label }) => label)).toEqual(["#12", "#9"]);
	});

	it("builds repository details with merged, open and optional issue links", () => {
		const details = buildOpenSourceRepositoryDetails(
			[{ project: "Repo", stars: 10, pullRequests: [{ label: "#2", href: "https://github.com/acme/repo/pull/2", contribution: "Merged fix" }] }],
			[{ project: "Repo", stars: 12, pullRequests: [{ label: "#3", href: "https://github.com/acme/repo/pull/3", issueHref: "https://github.com/acme/repo/issues/1", contribution: "Open fix" }] }],
		);

		expect(details).toHaveLength(1);
		expect(details[0]).toMatchObject({ project: "Repo", stars: 12, merged: 1, open: 1 });
		expect(details[0].pullRequests).toEqual(expect.arrayContaining([
			expect.objectContaining({ label: "#2", status: "merged" }),
			expect.objectContaining({ label: "#3", status: "open", issueHref: "https://github.com/acme/repo/issues/1" }),
		]));
	});

	it("places merged repositories first and sorts each status group by stars", () => {
		const details = buildOpenSourceRepositoryDetails(
			[
				{ project: "Merged Small", stars: 10, pullRequests: [{ label: "#1", href: "https://github.com/acme/small/pull/1", contribution: "Fix" }] },
				{ project: "Merged Large", stars: 20, pullRequests: [{ label: "#2", href: "https://github.com/acme/large/pull/2", contribution: "Fix" }] },
			],
			[
				{ project: "Open Small", stars: 100, pullRequests: [{ label: "#3", href: "https://github.com/acme/open-small/pull/3", contribution: "Fix" }] },
				{ project: "Open Large", stars: 200, pullRequests: [{ label: "#4", href: "https://github.com/acme/open-large/pull/4", contribution: "Fix" }] },
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
