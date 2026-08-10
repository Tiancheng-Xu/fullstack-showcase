import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../bottom-nav", () => ({
	BottomNav: () => <nav aria-label="主要导航">导航</nav>,
}));

import { AppShell } from "../app-shell";

describe("AppShell route chrome", () => {
	beforeEach(() => {
		window.history.pushState({}, "", "/growth");
	});

	it("hides parent navigation on authentication routes", () => {
		window.history.pushState({}, "", "/login");

		render(<AppShell>登录表单</AppShell>);

		expect(screen.getByText("登录表单")).toBeVisible();
		expect(
			screen.queryByRole("navigation", { name: "主要导航" }),
		).not.toBeInTheDocument();
	});

	it("shows parent navigation on product routes", () => {
		render(<AppShell>成长首页</AppShell>);

		expect(screen.getByRole("navigation", { name: "主要导航" })).toBeVisible();
	});
});
