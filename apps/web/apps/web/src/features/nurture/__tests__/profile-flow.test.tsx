import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EditBabyContent } from "../edit-baby-content";
import { ProfileContent } from "../profile-content";

describe("Stitch parent profile flow", () => {
	it("removes membership/cloud promises and keeps parent controls local", async () => {
		const user = userEvent.setup();
		const onLogout = vi.fn();
		render(<ProfileContent onLogout={onLogout} />);

		expect(screen.queryByText(/会员/)).not.toBeInTheDocument();
		expect(screen.queryByText(/云盘/)).not.toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "宝宝 · 金金" })).toBeVisible();
		expect(screen.getByRole("link", { name: "编辑宝宝资料" })).toHaveAttribute(
			"href",
			"/me/baby",
		);

		const reminders = screen.getByRole("switch", { name: "消息提醒" });
		expect(reminders).toHaveAttribute("aria-checked", "true");
		await user.click(reminders);
		expect(reminders).toHaveAttribute("aria-checked", "false");

		await user.click(screen.getByRole("button", { name: "退出登录" }));
		expect(
			screen.getByRole("dialog", { name: "确认退出登录？" }),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "确认退出" }));
		expect(onLogout).toHaveBeenCalledOnce();
	});

	it("submits edited baby data through a pure callback", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn();
		render(<EditBabyContent onSave={onSave} />);

		await user.clear(screen.getByLabelText("宝宝昵称"));
		await user.type(screen.getByLabelText("宝宝昵称"), "小金");
		await user.click(screen.getByRole("button", { name: "保存资料" }));

		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ nickname: "小金" }),
		);
	});
});
