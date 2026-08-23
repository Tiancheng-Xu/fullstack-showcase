import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: React.ComponentProps<"a"> & { to: string }) => <a href={to} {...props}>{children}</a>,
}));

import { EvidenceContent } from "../evidence-content";

describe("migrated Evidence content", () => {
	it("renders the complete source sections and reciprocal navigation", () => {
		const { container } = render(
			<EvidenceContent projectId="github-profile-studio" />,
		);

		for (const heading of [
			"迁移后的完整工作证明",
			"原始指标与术语",
			"目标与交付结果",
			"实施步骤与设计取舍",
			"架构与关键节点",
			"架构实现状态",
			"证据图与完整性",
			"Proof 矩阵",
			"关键难点与修复闭环",
			"限制与未验证边界",
		]) {
			expect(container).toHaveTextContent(heading);
		}
		const links = Array.from(container.querySelectorAll("a"));
		for (const link of ["作品集首页", "项目主页", "工作证明"]) {
			expect(links.some((anchor) => anchor.textContent === link)).toBe(true);
		}
	});

	it("opens and closes a proof image preview with Escape", () => {
		render(<EvidenceContent projectId="tc-workflow" />);
		fireEvent.click(screen.getByRole("button", { name: /全屏预览/ }));
		expect(screen.getByRole("dialog")).toBeVisible();
		fireEvent.keyDown(window, { key: "Escape" });
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
