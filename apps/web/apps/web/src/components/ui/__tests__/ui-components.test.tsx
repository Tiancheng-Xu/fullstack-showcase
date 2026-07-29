import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "../modal";
import { SectionHeader } from "../section-header";
import { StatusChip } from "../status-chip";

describe("shared UI components", () => {
	it("runs the section action through an accessible button", async () => {
		const user = userEvent.setup();
		const onAction = vi.fn();
		render(
			<SectionHeader
				actionLabel="查看全部"
				onAction={onAction}
				title="里程碑"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "查看全部" }));

		expect(onAction).toHaveBeenCalledOnce();
	});

	it("exposes an open modal as a labelled dialog and closes it", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<Modal onClose={onClose} open title="新增记录">
				表单内容
			</Modal>,
		);

		expect(screen.getByRole("dialog", { name: "新增记录" })).toBeVisible();
		await user.click(screen.getByRole("button", { name: "关闭" }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("does not mount closed modal content", () => {
		render(
			<Modal onClose={vi.fn()} open={false} title="新增记录">
				表单内容
			</Modal>,
		);

		expect(screen.queryByText("表单内容")).not.toBeInTheDocument();
	});

	it("labels status chips for assistive technology", () => {
		render(<StatusChip tone="success">正常</StatusChip>);

		expect(screen.getByText("正常")).toHaveAttribute("data-tone", "success");
	});
});
