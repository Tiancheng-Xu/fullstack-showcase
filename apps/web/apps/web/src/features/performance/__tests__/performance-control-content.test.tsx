import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
	controlErrorNotice,
	PerformanceControlContent,
} from "../performance-control-content";

describe("PerformanceControlContent", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("requests a single-use nonce only after the operator enters TOTP", async () => {
		const checkedAt = new Date(Date.now() - 1_000).toISOString();
		const freshUntil = new Date(Date.now() + 5 * 60_000).toISOString();
		const fetchMock = vi.fn(
			async (input: string | URL | Request, init?: RequestInit) => {
				const url = String(input);
				if (url.includes("/status"))
					return new Response(
						JSON.stringify({
							projectSlug: "performance-observability-control",
							controlState: "stopped",
							dataMode: "historical",
							cleanupVerified: true,
							expiresAt: null,
							estimatedCostUsd: 0.2,
							maximumRuntimeMinutes: 45,
							dispatchReadiness: {
								state: "ready",
								reason: "fixed_workflow_active",
								checkedAt,
								freshUntil,
							},
						}),
					);
				if (url.includes("/session"))
					return new Response(
						JSON.stringify({
							nonce: "nonce-1",
							expiresAt: "2099-01-01T00:00:00.000Z",
							mfaVerified: true,
							maximumRuntimeMinutes: 45,
							estimatedCostUsd: 0.2,
						}),
					);
				if (url.includes("/start") && init?.method === "POST")
					return new Response(
						JSON.stringify({
							controlState: "starting",
							expiresAt: "2099-01-01T00:45:00.000Z",
						}),
						{ status: 202 },
					);
				throw new Error(`unexpected fetch ${url}`);
			},
		);
		vi.stubGlobal("fetch", fetchMock);
		render(<PerformanceControlContent projectId="babysteps" />);

		expect(
			screen.getByRole("heading", { name: "性能观测成本控制" }),
		).toBeVisible();
		expect(screen.getAllByText(/TOTP/)).not.toHaveLength(0);
		expect(screen.getByText(/固定 GitHub Actions 工作流/)).toBeVisible();
		expect(screen.getByRole("heading", { name: "安全启动" })).toBeVisible();
		expect(screen.getByRole("heading", { name: "安全停止" })).toBeVisible();
		expect(screen.getByRole("link", { name: /BabySteps/ })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(screen.getByRole("link", { name: /Agent Market/ })).toHaveAttribute(
			"href",
			"/performance-control/agent-market",
		);
		expect(screen.getAllByText(/共享 VPC、NAT、RDS/)).not.toHaveLength(0);
		expect(screen.getByText("历史快照")).toBeVisible();
		expect(screen.getAllByText("960 ms")).toHaveLength(6);
		expect(screen.getAllByText("8.5 ms")).toHaveLength(3);
		expect(screen.getByText("79 样本 · 0 错误")).toBeVisible();
		expect(
			within(screen.getByText("样本数").parentElement as HTMLElement).getByText(
				"82",
			),
		).toBeVisible();
		expect(
			screen.getByRole("link", { name: /^查看 GitHub Run #33160455921$/ }),
		).toHaveAttribute(
			"href",
			"https://github.com/Tiancheng-Xu/babysteps/actions/runs/33160455921",
		);

		expect(
			fetchMock.mock.calls.some(([url]) => String(url).includes("/session")),
		).toBe(false);
		expect(screen.getByText("预计增量费用上限：USD 0.20")).toBeVisible();
		expect(screen.getByText("最长运行：45 分钟")).toBeVisible();
		const startButton = screen.getByRole("button", { name: "启动性能观测" });
		const stopButton = screen.getByRole("button", { name: "安全停止性能观测" });
		expect(startButton).toBeDisabled();
		expect(stopButton).toBeDisabled();
		fireEvent.change(screen.getByLabelText("6 位动态验证码"), {
			target: { value: "123456" },
		});
		await waitFor(() => expect(startButton).toBeEnabled());
		fireEvent.click(startButton);
		await waitFor(() =>
			expect(
				fetchMock.mock.calls.some(([url]) => String(url).includes("/session")),
			).toBe(true),
		);
		expect(
			fetchMock.mock.calls.every(([url]) =>
				String(url).includes("project=performance-observability-control"),
			),
		).toBe(true);
		await waitFor(() =>
			expect(
				fetchMock.mock.calls.some(([url]) => String(url).includes("/start")),
			).toBe(true),
		);
		const sessionCall = fetchMock.mock.calls.find(([url]) =>
			String(url).includes("/session"),
		);
		expect(new Headers(sessionCall?.[1]?.headers).get("x-control-totp")).toBe(
			"123456",
		);
		const startCall = fetchMock.mock.calls.find(([url]) =>
			String(url).includes("/start"),
		);
		expect(new Headers(startCall?.[1]?.headers).has("x-control-totp")).toBe(
			false,
		);
		expect(await screen.findByText(/启动请求已受理/)).toBeVisible();
	});

	it("rejects unknown projects without exposing a generic AWS control panel", () => {
		render(<PerformanceControlContent projectId="unknown" />);

		expect(screen.getByRole("heading", { name: "项目不可控制" })).toBeVisible();
		expect(screen.queryByRole("button", { name: "启动性能观测" })).toBeNull();
	});

	it("disables TOTP and start when the fixed workflow is paused", async () => {
		const checkedAt = new Date(Date.now() - 1_000).toISOString();
		const freshUntil = new Date(Date.now() + 5 * 60_000).toISOString();
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(
						JSON.stringify({
							projectSlug: "performance-observability-control",
							controlState: "stopped",
							dataMode: "historical",
							cleanupVerified: true,
							expiresAt: null,
							estimatedCostUsd: 0.2,
							maximumRuntimeMinutes: 45,
							dispatchReadiness: {
								state: "workflow_disabled",
								reason: "fixed_workflow_not_active",
								checkedAt,
								freshUntil,
							},
						}),
					),
			),
		);

		render(<PerformanceControlContent projectId="babysteps" />);

		expect(await screen.findByText("GitHub 控制工作流已暂停")).toBeVisible();
		expect(screen.getByLabelText("6 位动态验证码")).toBeDisabled();
		expect(screen.getByRole("button", { name: "启动性能观测" })).toBeDisabled();
	});

	it("keeps TOTP disabled while control state and readiness are unknown", () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

		render(<PerformanceControlContent projectId="babysteps" />);

		expect(screen.getByLabelText("6 位动态验证码")).toBeDisabled();
		expect(screen.getByRole("button", { name: "启动性能观测" })).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "安全停止性能观测" }),
		).toBeDisabled();
	});

	it("locks a stopped start control as soon as cached readiness expires", async () => {
		vi.useFakeTimers({ now: new Date("2026-09-04T12:00:00.000Z") });
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(
						JSON.stringify({
							projectSlug: "performance-observability-control",
							controlState: "stopped",
							dataMode: "historical",
							cleanupVerified: true,
							expiresAt: null,
							estimatedCostUsd: 0.2,
							maximumRuntimeMinutes: 45,
							dispatchReadiness: {
								state: "ready",
								reason: "fixed_workflow_active",
								checkedAt: "2026-09-04T11:59:59.000Z",
								freshUntil: "2026-09-04T12:00:01.000Z",
							},
						}),
					),
			),
		);

		render(<PerformanceControlContent projectId="babysteps" />);
		await act(async () => Promise.resolve());
		expect(screen.getByLabelText("6 位动态验证码")).toBeEnabled();

		await act(async () => {
			vi.advanceTimersByTime(1_000);
			await Promise.resolve();
		});
		expect(screen.getByText("调度就绪状态已过期")).toBeVisible();
		expect(screen.getByLabelText("6 位动态验证码")).toBeDisabled();
		vi.useRealTimers();
	});

	it("lists a planned application without inventing metrics or enabling controls", () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		render(<PerformanceControlContent projectId="agent-market" />);

		expect(screen.getByText("观测接入尚未完成")).toBeVisible();
		expect(screen.getByText("暂无可信快照")).toBeVisible();
		expect(screen.queryByRole("button", { name: "启动性能观测" })).toBeNull();
		expect(screen.getByRole("link", { name: /Agent Market/ })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("polls active states every five seconds and refreshes immediately at TTL zero", async () => {
		vi.useFakeTimers();
		let statusCalls = 0;
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: string | URL | Request) => {
				const url = String(input);
				if (url.includes("/status")) {
					statusCalls += 1;
					return new Response(
						JSON.stringify({
							controlState: "running",
							dataMode: "live",
							cleanupVerified: false,
							expiresAt: new Date(Date.now() + 1_000).toISOString(),
							estimatedCostUsd: 0.2,
							maximumRuntimeMinutes: 45,
						}),
					);
				}
				throw new Error(`unexpected fetch ${url}`);
			}),
		);
		render(<PerformanceControlContent projectId="babysteps" />);
		await act(async () => Promise.resolve());
		expect(statusCalls).toBe(1);
		await act(async () => {
			vi.advanceTimersByTime(1_000);
			await Promise.resolve();
		});
		expect(statusCalls).toBe(2);
		await act(async () => {
			vi.advanceTimersByTime(5_000);
			await Promise.resolve();
		});
		expect(statusCalls).toBeGreaterThanOrEqual(3);
		vi.useRealTimers();
	});

	it("allows an MFA operator to submit stop for a degraded run without an expiry", async () => {
		const fetchMock = vi.fn(
			async (input: string | URL | Request, init?: RequestInit) => {
				const url = String(input);
				if (url.includes("/status"))
					return new Response(
						JSON.stringify({
							controlState: "degraded",
							cleanupVerified: false,
							expiresAt: null,
							estimatedCostUsd: 0.2,
							maximumRuntimeMinutes: 45,
						}),
					);
				if (url.includes("/session"))
					return new Response(
						JSON.stringify({
							nonce: "nonce-degraded",
							expiresAt: "2099-01-01T00:00:00.000Z",
							mfaVerified: true,
							estimatedCostUsd: 0.2,
							maximumRuntimeMinutes: 45,
						}),
					);
				if (url.includes("/stop") && init?.method === "POST")
					return new Response(JSON.stringify({ controlState: "stopping" }), {
						status: 202,
					});
				throw new Error(`unexpected fetch ${url}`);
			},
		);
		vi.stubGlobal("fetch", fetchMock);
		render(<PerformanceControlContent projectId="babysteps" />);
		fireEvent.change(screen.getByLabelText("6 位动态验证码"), {
			target: { value: "123456" },
		});
		const stop = screen.getByRole("button", { name: "安全停止性能观测" });
		await waitFor(() => expect(stop).toBeEnabled());
		fireEvent.click(stop);
		await waitFor(() =>
			expect(
				fetchMock.mock.calls.some(([url]) => String(url).includes("/stop")),
			).toBe(true),
		);
		const stopCall = fetchMock.mock.calls.find(([url]) =>
			String(url).includes("/stop"),
		);
		expect(new Headers(stopCall?.[1]?.headers).has("x-control-totp")).toBe(
			false,
		);
	});

	it("distinguishes GitHub control failures from invalid TOTP", () => {
		expect(controlErrorNotice("github_app_unavailable")).toContain(
			"未启动 AWS 资源",
		);
		expect(controlErrorNotice("github_dispatch_failed")).toContain(
			"禁止再次启动",
		);
		expect(controlErrorNotice("github_dispatch_unconfirmed")).toContain(
			"结果待确认",
		);
		expect(controlErrorNotice("totp_invalid")).toContain("验证码无效");
	});
});
