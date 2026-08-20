import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PerformanceStatusCard } from "../performance-status-card";

describe("PerformanceStatusCard", () => {
	it("explains that stopped data is historical and exposes one protected control entry", () => {
		render(
			<PerformanceStatusCard
				projectId="showcase-dashboard"
				projectName="Showcase Dashboard"
				status={{
					controlState: "stopped",
					dataMode: "unavailable",
					label: "暂无可信快照",
					snapshot: null,
					detail: "观测服务已停止，且尚无通过校验的历史快照。",
				}}
			/>,
		);

		expect(screen.getByText("暂无可信快照")).toBeVisible();
		expect(screen.getByText(/不会生成模拟性能数据/)).toBeVisible();
		expect(
			screen.getByRole("link", { name: /进入成本控制/ }),
		).toHaveAttribute("href", "/performance-control?project=showcase-dashboard");
	});
});
