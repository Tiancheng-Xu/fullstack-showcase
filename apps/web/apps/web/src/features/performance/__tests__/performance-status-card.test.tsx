import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PerformanceStatusCard } from "../performance-status-card";

describe("PerformanceStatusCard", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});
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
		).toHaveAttribute("href", "/performance-control/showcase-dashboard");
	});

	it("renders every verified metric as percentile bars", () => {
		render(
			<PerformanceStatusCard
				projectId="performance-observability-control"
				projectName="性能观测与成本控制"
				status={{
					controlState: "stopped",
					dataMode: "historical",
					label: "历史快照",
					detail: "真实不可变快照",
					snapshot: {
						captureId: "capture-v2",
						capturedAt: "2026-08-27T00:30:00.000Z",
						window: "closed-loop-smoke",
						kind: "synthetic-closed-loop",
						source: {
							repository: "Tiancheng-Xu/babysteps",
							commitSha: "0123456789abcdef0123456789abcdef01234567",
							workflowRunId: "33037553599",
							sdkVersion: "2.0.0",
							cleanerVersion: "2.0.0",
						},
						method: { percentile: "nearest-rank", sampleRate: 1 },
						filters: { environment: "production" },
						schemaVersion: "performance-snapshot/v1",
						digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
						metrics: [
							{ name: "LCP", unit: "ms", page: "all", route: "all", sampleCount: 20, p50: 900, p75: 1100, p95: 1400, errorCount: 0 },
							{ name: "api.duration", unit: "ms", page: "all", route: "all", sampleCount: 40, p50: 80, p75: 130, p95: 300, errorCount: 0 },
						],
					},
				}}
			/>,
		);

		expect(screen.getByText("LCP")).toBeVisible();
		expect(screen.getByText("api.duration")).toBeVisible();
		expect(screen.getByText("1100 ms")).toBeVisible();
		expect(screen.getByText("130 ms")).toBeVisible();
	});

	it("hydrates from the verified public v2 snapshot without inventing fallback data", async () => {
		vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes("/status")) return new Response(JSON.stringify({ controlState: "stopped" }), { status: 200 });
			return new Response(JSON.stringify({
				schemaVersion: 2,
				projectSlug: "performance-observability-control",
				captureId: "capture-live-v2",
				capturedAt: "2026-08-27T00:30:00.000Z",
				kind: "synthetic-closed-loop",
				window: { preset: "1h", from: "2026-08-27T00:00:00.000Z", to: "2026-08-27T01:00:00.000Z" },
				repository: "Tiancheng-Xu/babysteps",
				commitSha: "0123456789abcdef0123456789abcdef01234567",
				workflowRunId: "33037553599",
				sdkVersion: "2.0.0",
				cleanerVersion: "2.0.0",
				percentileMethod: "nearest-rank",
				sampleRate: 1,
				filters: { environment: "production" },
				summary: { totalEvents: 3, errorCount: 0, errorRate: 0, metricCount: 1, routeCount: 1, latestEventAt: 1787773600000 },
				operation: { estimatedIncrementalCostUsd: 0.12, maximumIncrementalCostUsd: 0.2, ttlMinutes: 45, observedRuntimeMinutes: 15 },
				metrics: [{ name: "LCP", category: "web-vital", unit: "ms", page: "all", route: "all", sampleCount: 3, p50: 900, p75: 1100, p95: 1400, errorCount: 0, routes: [], trend: [] }],
			}), { status: 200 });
		}));

		render(<PerformanceStatusCard projectId="performance-observability-control" projectName="性能观测与成本控制" status={{ controlState: "stopped", dataMode: "unavailable", label: "暂无可信快照", detail: "无快照", snapshot: null }} />);
		expect(await screen.findByText(/capture-live-v2/)).toBeVisible();
		expect(screen.getByText("LCP")).toBeVisible();
	});
});
