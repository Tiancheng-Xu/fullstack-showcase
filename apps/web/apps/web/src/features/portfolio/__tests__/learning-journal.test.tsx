import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardContent } from "../dashboard-content";
import { SharingIndexContent } from "../sharing-index-content";

async function renderSharing() {
	const rootRoute = createRootRoute({ component: Outlet });
	const sharingRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/sharing",
		component: SharingIndexContent,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([sharingRoute]),
		history: createMemoryHistory({ initialEntries: ["/sharing"] }),
	});
	render(<RouterProvider router={router} />);
	await screen.findByRole("heading", {
		name: "Overreacted 阅读路线",
		level: 2,
	});
}

describe("Learning Journal placement and navigation", () => {
	beforeEach(() => vi.stubGlobal("scrollTo", vi.fn()));
	afterEach(() => vi.unstubAllGlobals());
	it("links from existing home capabilities to the Share module without duplicating it", () => {
		render(<DashboardContent />);
		const capabilities = screen.getByRole("heading", {
			name: "核心能力",
		}).parentElement;
		expect(capabilities).not.toBeNull();
		if (!capabilities) throw new Error("Home capabilities section is missing");
		expect(
			within(capabilities).getByRole("link", { name: /学习手记/ }),
		).toHaveAttribute("href", "/sharing/#learning-journal");
		expect(
			screen.queryByRole("region", { name: "学习手记" }),
		).not.toBeInTheDocument();
	});

	it("pins the only full module before the existing Share topics", async () => {
		await renderSharing();
		const journal = screen.getByRole("region", { name: "学习手记" });
		expect(journal).toHaveAttribute("id", "learning-journal");
		expect(screen.getAllByRole("heading", { level: 2 })[0]).toHaveTextContent(
			"学习手记",
		);
		for (const name of [
			"Overreacted 阅读路线",
			"AI 前瞻会议",
			"V8：从 JavaScript 到机器码",
		]) {
			expect(screen.getByRole("heading", { name, level: 2 })).toBeVisible();
		}
		expect(
			within(journal).getByRole("link", { name: /查看已有阅读与分享/ }),
		).toHaveAttribute("href", "#sharing-articles");
		expect(document.getElementById("sharing-articles")).not.toBeNull();
	});

	it("does not expose a completed collection article before one is accepted", async () => {
		await renderSharing();
		const journal = within(screen.getByRole("region", { name: "学习手记" }));
		expect(journal.getByRole("status")).toBeVisible();
		expect(journal.getByRole("status")).toHaveTextContent(/完成核验后/);
		expect(journal.getByRole("status")).not.toHaveTextContent(
			/已完成|已掌握|已通过全部验收/,
		);
		expect(journal.queryAllByRole("article")).toHaveLength(0);
		expect(journal.getAllByRole("link")).toHaveLength(1);
	});
});
