import { describe, expect, it } from "vitest";

import { orderOpenSourceContributions } from "../open-source-contributions";

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
});
