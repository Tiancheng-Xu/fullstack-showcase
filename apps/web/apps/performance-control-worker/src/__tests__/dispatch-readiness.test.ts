import { describe, expect, it, vi } from "vitest";
import {
	probeGitHubWorkflowReadiness,
	type RegisteredWorkflowTarget,
} from "../dispatch-readiness";

const target: RegisteredWorkflowTarget = {
	repository: "Tiancheng-Xu/babysteps",
	workflow: "aws-performance-control.yml",
	defaultBranch: "main",
};

const now = new Date("2026-09-04T12:00:00.000Z");

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});

describe("probeGitHubWorkflowReadiness", () => {
	it("returns ready from the fixed Actions workflow endpoint without requesting Contents permission", async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
			jsonResponse({
				path: ".github/workflows/aws-performance-control.yml",
				state: "active",
			}),
		);

		const result = await probeGitHubWorkflowReadiness(
			target,
			"installation-token",
			{
				fetcher,
				now,
			},
		);

		expect(result).toEqual({
			state: "ready",
			reason: "fixed_workflow_active",
			checkedAt: "2026-09-04T12:00:00.000Z",
			freshUntil: "2026-09-04T12:10:00.000Z",
		});
		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(fetcher.mock.calls[0]?.[0]).toBe(
			"https://api.github.com/repos/Tiancheng-Xu/babysteps/actions/workflows/aws-performance-control.yml",
		);
		expect(String(fetcher.mock.calls[0]?.[0])).not.toContain("/contents/");
		expect(JSON.stringify(result)).not.toContain("installation-token");
	});

	it("reports a manually disabled workflow without dispatching", async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
			jsonResponse({
				path: ".github/workflows/aws-performance-control.yml",
				state: "disabled_manually",
			}),
		);

		await expect(
			probeGitHubWorkflowReadiness(target, "installation-token", {
				fetcher,
				now,
			}),
		).resolves.toMatchObject({
			state: "workflow_disabled",
			reason: "fixed_workflow_not_active",
		});
	});

	it("reports the fixed workflow as missing when GitHub cannot resolve its filename", async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(jsonResponse({}, 404));

		await expect(
			probeGitHubWorkflowReadiness(target, "installation-token", {
				fetcher,
				now,
			}),
		).resolves.toMatchObject({
			state: "workflow_missing",
			reason: "fixed_workflow_not_found",
		});
		expect(fetcher).toHaveBeenCalledTimes(1);
	});

	it("fails closed when the installation lacks repository permissions", async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(jsonResponse({}, 403));

		await expect(
			probeGitHubWorkflowReadiness(target, "installation-token", {
				fetcher,
				now,
			}),
		).resolves.toMatchObject({
			state: "permission_denied",
			reason: "github_app_permission_denied",
		});
	});

	it("fails closed on malformed GitHub responses", async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
			jsonResponse({
				path: ".github/workflows/another-workflow.yml",
				state: "active",
			}),
		);

		await expect(
			probeGitHubWorkflowReadiness(target, "installation-token", {
				fetcher,
				now,
			}),
		).resolves.toMatchObject({
			state: "app_unavailable",
			reason: "github_response_invalid",
		});
	});

	it("fails closed on transport errors and when no installation token is available", async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockRejectedValueOnce(new Error("network unavailable"));

		await expect(
			probeGitHubWorkflowReadiness(target, "installation-token", {
				fetcher,
				now,
			}),
		).resolves.toMatchObject({ state: "app_unavailable" });
		await expect(
			probeGitHubWorkflowReadiness(target, "", { fetcher, now }),
		).resolves.toMatchObject({ state: "app_unavailable" });
		expect(fetcher).toHaveBeenCalledTimes(1);
	});

	it("bounds a stalled GitHub request and fails closed", async () => {
		const fetcher = vi.fn<typeof fetch>(
			(_input, init) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener("abort", () =>
						reject(new DOMException("request aborted", "AbortError")),
					);
				}),
		);

		await expect(
			probeGitHubWorkflowReadiness(target, "installation-token", {
				fetcher,
				now,
				timeoutMs: 5,
			}),
		).resolves.toMatchObject({
			state: "app_unavailable",
			reason: "github_app_unavailable",
		});
		expect(fetcher.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
	});

	it("bounds a stalled GitHub response body and fails closed", async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => new Promise(() => undefined),
		} as Response);

		await expect(
			probeGitHubWorkflowReadiness(target, "installation-token", {
				fetcher,
				now,
				timeoutMs: 5,
			}),
		).resolves.toMatchObject({
			state: "app_unavailable",
			reason: "github_app_unavailable",
		});
	});
});
