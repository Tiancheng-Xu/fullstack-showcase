import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		...props
	}: React.ComponentProps<"a"> & { to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useRouter: () => undefined,
}));

import { DashboardContent } from "../dashboard-content";
import { EvidenceContent } from "../evidence-content";

describe("performance observability Evidence integration", () => {
	it("keeps the detailed performance snapshot and control entry off the Dashboard", () => {
		render(<DashboardContent />);

		expect(screen.queryByText("历史快照")).not.toBeInTheDocument();
		expect(screen.queryByText("960 ms")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: /进入成本控制/ }),
		).not.toBeInTheDocument();
	});

	it("publishes the approved architecture, delivery, security, lifecycle and non-goal decisions on Evidence", () => {
		render(<EvidenceContent projectId="performance-observability-control" />);

		for (const heading of [
			"交付要求到证据映射",
			"运行架构",
			"GitHub Actions 与发布",
			"预览环境与灰度发布",
			"关键时序",
			"权限、网络与安全边界",
			"费用与共享基础设施",
			"明确不做",
		]) {
			expect(screen.getByRole("heading", { name: heading })).toBeVisible();
		}

		expect(screen.getByText(/Athena、Glue、Firehose/)).toBeVisible();
		expect(screen.getByText(/常驻 ECS/)).toBeVisible();
		expect(screen.getByText(/AI Agent 自动删除或重放资源/)).toBeVisible();
		expect(screen.getAllByText(/云端未部署/)).not.toHaveLength(0);
		expect(screen.getAllByText(/云端已验证/)).not.toHaveLength(0);
		for (const diagramHeading of [
			"运行架构图",
			"GitHub Actions、预览与灰度",
			"启动、采集与停止时序",
		]) {
			expect(
				screen.getByRole("heading", { name: diagramHeading }),
			).toBeVisible();
		}
		expect(screen.getAllByText(/Cloudflare Pages/)).not.toHaveLength(0);
		expect(screen.getAllByText(/GitHub Actions/)).not.toHaveLength(0);
		expect(screen.getAllByText(/共享 VPC/)).not.toHaveLength(0);
		expect(screen.getAllByText(/DLQ/)).not.toHaveLength(0);
		expect(screen.getAllByText(/清理验证/)).not.toHaveLength(0);
		expect(screen.getByRole("link", { name: /进入成本控制/ })).toHaveAttribute(
			"href",
			"/performance-control/babysteps",
		);
	});
});
