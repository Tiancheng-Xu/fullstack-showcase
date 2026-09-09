import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	DispatchReadinessNotice,
	type DispatchReadinessView,
	isDispatchReady,
} from "../dispatch-readiness-notice";

const reasons: Record<DispatchReadinessView["state"], string> = {
	ready: "fixed_workflow_active",
	workflow_disabled: "fixed_workflow_not_active",
	workflow_missing: "fixed_workflow_not_found",
	app_unavailable: "github_app_unavailable",
	permission_denied: "github_app_permission_denied",
	unknown: "readiness_not_checked",
	stale: "readiness_expired",
};

const readiness = (
	state: DispatchReadinessView["state"],
): DispatchReadinessView => ({
	state,
	reason: reasons[state],
	checkedAt: "2026-09-04T12:00:00.000Z",
	freshUntil: "2026-09-04T12:05:00.000Z",
});

const testNow = Date.parse("2026-09-04T12:01:00.000Z");

describe("DispatchReadinessNotice", () => {
	it("marks only a ready fixed workflow as dispatchable", () => {
		expect(isDispatchReady(readiness("ready"), testNow)).toBe(true);
		for (const state of [
			"workflow_disabled",
			"workflow_missing",
			"app_unavailable",
			"permission_denied",
			"unknown",
			"stale",
		] as const) {
			expect(isDispatchReady(readiness(state), testNow)).toBe(false);
		}
	});

	it("expires a previously ready result in the browser", () => {
		expect(
			isDispatchReady(
				readiness("ready"),
				Date.parse("2026-09-04T12:05:00.000Z"),
			),
		).toBe(false);
		render(
			<DispatchReadinessNotice
				now={Date.parse("2026-09-04T12:05:00.000Z")}
				readiness={readiness("ready")}
			/>,
		);
		expect(screen.getByText("调度就绪状态已过期")).toBeVisible();
	});

	it("explains a manually paused workflow before TOTP", () => {
		const { container } = render(
			<DispatchReadinessNotice
				now={testNow}
				readiness={readiness("workflow_disabled")}
			/>,
		);

		expect(screen.getByText("GitHub 控制工作流已暂停")).toBeVisible();
		expect(screen.getByText(/不会消耗 TOTP 验证次数/)).toBeVisible();
		expect(container.querySelector("section")).toHaveAttribute(
			"data-readiness-state",
			"workflow_disabled",
		);
	});

	it("fails closed when readiness has not been checked", () => {
		render(<DispatchReadinessNotice now={testNow} readiness={null} />);

		expect(screen.getByText("尚未验证调度入口")).toBeVisible();
		expect(screen.getByLabelText("调度不可用")).toHaveTextContent("BLOCKED");
	});

	it.each([
		["workflow_missing", "固定控制工作流不存在"],
		["permission_denied", "GitHub App 权限不足"],
		["app_unavailable", "GitHub App 当前不可用"],
		["stale", "调度就绪状态已过期"],
	] as const)("renders %s with precise operator copy", (state, label) => {
		render(
			<DispatchReadinessNotice now={testNow} readiness={readiness(state)} />,
		);
		expect(screen.getByText(label)).toBeVisible();
	});
});
