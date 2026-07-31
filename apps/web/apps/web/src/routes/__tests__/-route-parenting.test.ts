import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

describe("parent product route structure", () => {
	it("keeps detail screens independent from list-page components", () => {
		const detailPaths = [
			"/growth/records",
			"/moments/$momentId",
			"/guide/$articleId",
			"/me/baby",
		];
		const rootPaths = Object.values(routeTree.children ?? {}).map(
			(route) => route.options.path,
		);

		expect(rootPaths).toEqual(expect.arrayContaining(detailPaths));
	});
});
