import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: React.ComponentProps<"a"> & { to: string }) => (
		<a href={to} {...props}>{children}</a>
	),
}));

import { DashboardContent } from "../dashboard-content";
import { EvidenceContent } from "../evidence-content";

describe("Shared Evidence Verifier portfolio delivery", () => {
	it("publishes the verified cloud project on the Dashboard", () => {
		render(<DashboardContent />);
		expect(screen.getAllByRole("heading", { name: "Shared Evidence Verifier" })).not.toHaveLength(0);
		expect(screen.getByText(/6\/6 串行项目检查/)).toBeVisible();
	});

	it("shows architecture, sequence, proof boundaries and fullscreen preview", () => {
		render(<EvidenceContent projectId="shared-evidence-verifier" />);

		expect(screen.getByRole("heading", { name: "共享验证架构图" })).toBeVisible();
		expect(screen.getByRole("heading", { name: "串行验证时序图" })).toBeVisible();
		expect(screen.getByRole("heading", { name: "交付要求到证据映射" })).toBeVisible();
		expect(screen.getAllByText(/verified-with-limitations/)).not.toHaveLength(0);
		expect(screen.getAllByText(/Run 33290528028/)).not.toHaveLength(0);

		fireEvent.click(screen.getAllByRole("button", { name: /全屏预览/ })[0]);
		expect(screen.getByRole("dialog", { name: "共享验证架构图" })).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "关闭全屏预览" }));
		expect(screen.queryByRole("dialog", { name: "共享验证架构图" })).not.toBeInTheDocument();
	});
});
