import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PerformanceControlContent } from "../performance-control-content";

describe("PerformanceControlContent", () => {
	it("shows the verified historical AWS run without pretending fixed controls are live", () => {
		render(
			<PerformanceControlContent projectId="performance-observability-control" />,
		);

		expect(
			screen.getByRole("heading", { name: "性能观测成本控制" }),
		).toBeVisible();
		expect(screen.getAllByText(/Cloudflare Access/)).not.toHaveLength(0);
		expect(screen.getByText(/固定 GitHub Actions 工作流/)).toBeVisible();
		expect(screen.getByRole("heading", { name: "安全启动" })).toBeVisible();
		expect(screen.getByRole("heading", { name: "安全停止" })).toBeVisible();
		expect(screen.getAllByText(/共享 VPC、NAT、RDS/)).not.toHaveLength(0);
		expect(screen.getByText("历史快照")).toBeVisible();
		expect(screen.getAllByText("321 ms")).toHaveLength(3);
		expect(within(screen.getByText("样本数").parentElement as HTMLElement).getByText("1")).toBeVisible();
		expect(
			screen.getByRole("link", { name: /^查看 GitHub Run #32917816824$/ }),
		).toHaveAttribute(
			"href",
			"https://github.com/Tiancheng-Xu/babysteps/actions/runs/32917816824",
		);

		const startButton = screen.getByRole("button", { name: "启动性能观测" });
		const stopButton = screen.getByRole("button", { name: "安全停止性能观测" });
		expect(startButton).toBeDisabled();
		expect(stopButton).toBeDisabled();
		expect(screen.getAllByText(/固定启停控制尚未部署/)).not.toHaveLength(0);
	});

	it("rejects unknown projects without exposing a generic AWS control panel", () => {
		render(<PerformanceControlContent projectId="unknown" />);

		expect(screen.getByRole("heading", { name: "项目不可控制" })).toBeVisible();
		expect(screen.queryByRole("button", { name: "启动性能观测" })).toBeNull();
	});
});
